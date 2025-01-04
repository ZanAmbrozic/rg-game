import { BaseRenderer } from './BaseRenderer.js';
import { Camera } from '../core/Camera.js';
import {
    getGlobalModelMatrix,
    getGlobalViewMatrix,
    getLocalModelMatrix,
    getProjectionMatrix,
} from '../core/SceneUtils.js';
import { mat4, vec3 } from 'gl-matrix';
import { Model } from '../core/Model.js';
import { Light } from '../core/Light.js';
import { HUD } from '../core/HUD.js';

const vertexBufferLayout = {
    arrayStride: 32,
    attributes: [
        {
            name: 'position',
            shaderLocation: 0,
            offset: 0,
            format: 'float32x3',
        },
        {
            name: 'texcoords',
            shaderLocation: 1,
            offset: 12,
            format: 'float32x2',
        },
        {
            name: 'normal',
            shaderLocation: 2,
            offset: 20,
            format: 'float32x3',
        },
    ],
};

export class LitRenderer extends BaseRenderer {
    constructor(canvas) {
        super(canvas);
    }

    async initialize() {
        await super.initialize();

        const code = await fetch(new URL('shader.wgsl', import.meta.url)).then(
            (response) => response.text(),
        );
        const module = this.device.createShaderModule({ code });

        this.pipeline = await this.device.createRenderPipelineAsync({
            label: 'default',
            layout: 'auto',
            vertex: {
                module,
                buffers: [vertexBufferLayout],
            },
            fragment: {
                module,
                targets: [
                    {
                        format: this.format,
                        blend: {
                            color: {
                                srcFactor: 'one',
                                dstFactor: 'one-minus-src-alpha',
                            },
                            alpha: {
                                srcFactor: 'one',
                                dstFactor: 'one-minus-src-alpha',
                            },
                        },
                    },
                ],
            },
            depthStencil: {
                format: 'depth24plus',
                depthWriteEnabled: true,
                depthCompare: 'less',
            },
        });

        this.hudPipeline = await this.device.createRenderPipelineAsync({
            label: 'hud',
            layout: 'auto',
            vertex: {
                module,
                buffers: [vertexBufferLayout],
            },
            fragment: {
                module,
                targets: [
                    {
                        format: this.format,
                        blend: {
                            color: {
                                srcFactor: 'one',
                                dstFactor: 'one-minus-src-alpha',
                            },
                            alpha: {
                                srcFactor: 'one',
                                dstFactor: 'one-minus-src-alpha',
                            },
                        },
                    },
                ],
            },
            depthStencil: {
                format: 'depth24plus',
                depthWriteEnabled: true,
                depthCompare: 'less',
            },
        });

        const skyboxCode = await fetch(
            new URL('skybox.wgsl', import.meta.url),
        ).then((response) => response.text());
        const skyboxModule = this.device.createShaderModule({
            code: skyboxCode,
        });

        this.skyboxPipeline = await this.device.createRenderPipelineAsync({
            layout: 'auto',
            vertex: {
                module: skyboxModule,
                buffers: [
                    {
                        arrayStride: 8,
                        attributes: [
                            {
                                shaderLocation: 0,
                                offset: 0,
                                format: 'float32x2',
                            },
                        ],
                    },
                ],
            },
            fragment: {
                module: skyboxModule,
                targets: [{ format: this.format }],
            },
            depthStencil: {
                format: 'depth24plus',
                depthWriteEnabled: false,
                depthCompare: 'less-equal',
            },
            primitive: {
                topology: 'triangle-strip',
            },
        });

        const clipQuadVertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);

        this.clipQuadBuffer = this.device.createBuffer({
            size: clipQuadVertices.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });

        this.device.queue.writeBuffer(this.clipQuadBuffer, 0, clipQuadVertices);

        this.recreateDepthTexture();
    }

    setEnvironment(images) {
        this.environmentTexture?.destroy();
        this.environmentTexture = this.device.createTexture({
            size: [images[0].width, images[0].height, 6],
            format: 'rgba8unorm-srgb',
            usage:
                GPUTextureUsage.TEXTURE_BINDING |
                GPUTextureUsage.COPY_DST |
                GPUTextureUsage.RENDER_ATTACHMENT,
        });

        for (let i = 0; i < images.length; i++) {
            this.device.queue.copyExternalImageToTexture(
                { source: images[i] },
                { texture: this.environmentTexture, origin: [0, 0, i] },
                [images[i].width, images[i].height],
            );
        }

        this.environmentSampler = this.device.createSampler({
            minFilter: 'linear',
            magFilter: 'linear',
        });

        // this.environmentBindGroup = this.device.createBindGroup({
        //     label: 'environmentBindGroup',
        //     layout: this.pipeline.getBindGroupLayout(3),
        //     entries: [
        //         {
        //             binding: 0,
        //             resource: this.environmentTexture.createView({
        //                 dimension: 'cube',
        //             }),
        //         },
        //         { binding: 1, resource: this.environmentSampler },
        //     ],
        // });

        this.skyboxBindGroup = this.device.createBindGroup({
            label: 'skyboxBindGroup',
            layout: this.skyboxPipeline.getBindGroupLayout(1),
            entries: [
                {
                    binding: 0,
                    resource: this.environmentTexture.createView({
                        dimension: 'cube',
                    }),
                },
                { binding: 1, resource: this.environmentSampler },
            ],
        });
    }

    recreateDepthTexture() {
        this.depthTexture?.destroy();
        this.depthTexture = this.device.createTexture({
            format: 'depth24plus',
            size: [this.canvas.width, this.canvas.height],
            usage: GPUTextureUsage.RENDER_ATTACHMENT,
        });
    }

    prepareNode(node) {
        if (this.gpuObjects.has(node)) {
            return this.gpuObjects.get(node);
        }

        const modelUniformBuffer = this.device.createBuffer({
            size: 128,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        const modelBindGroup = this.device.createBindGroup({
            label: 'modelBindGroup',
            layout: this.pipeline.getBindGroupLayout(1),
            entries: [{ binding: 0, resource: { buffer: modelUniformBuffer } }],
        });

        const hudModelUniformBuffer = this.device.createBuffer({
            size: 128,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        const hudModelBindGroup = this.device.createBindGroup({
            label: 'hudModelBindGroup',
            layout: this.hudPipeline.getBindGroupLayout(1),
            entries: [
                { binding: 0, resource: { buffer: hudModelUniformBuffer } },
            ],
        });

        const gpuObjects = {
            modelUniformBuffer,
            modelBindGroup,
            hudModelUniformBuffer,
            hudModelBindGroup,
        };
        this.gpuObjects.set(node, gpuObjects);
        return gpuObjects;
    }

    prepareCamera(camera) {
        if (this.gpuObjects.has(camera)) {
            return this.gpuObjects.get(camera);
        }

        const cameraUniformBuffer = this.device.createBuffer({
            size: 144,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        const cameraBindGroup = this.device.createBindGroup({
            label: 'cameraBindGroup',
            layout: this.pipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: cameraUniformBuffer } },
            ],
        });

        const hudCameraUniformBuffer = this.device.createBuffer({
            size: 144,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        const hudCameraBindGroup = this.device.createBindGroup({
            label: 'hudCameraBindGroup',
            layout: this.hudPipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: hudCameraUniformBuffer } },
            ],
        });

        const unprojectUniformBuffer = this.device.createBuffer({
            size: 64,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        const unprojectBindGroup = this.device.createBindGroup({
            label: 'unprojectBindGroup',
            layout: this.skyboxPipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: unprojectUniformBuffer } },
            ],
        });

        const gpuObjects = {
            cameraUniformBuffer,
            cameraBindGroup,
            unprojectUniformBuffer,
            unprojectBindGroup,
            hudCameraUniformBuffer,
            hudCameraBindGroup,
        };
        this.gpuObjects.set(camera, gpuObjects);
        return gpuObjects;
    }

    prepareLight(light) {
        if (this.gpuObjects.has(light)) {
            return this.gpuObjects.get(light);
        }

        const lightUniformBuffer = this.device.createBuffer({
            size: 32,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        const lightBindGroup = this.device.createBindGroup({
            label: 'lightBindGroup',
            layout: this.pipeline.getBindGroupLayout(3),
            entries: [{ binding: 0, resource: { buffer: lightUniformBuffer } }],
        });

        const hudLightUniformBuffer = this.device.createBuffer({
            size: 32,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        const hudLightBindGroup = this.device.createBindGroup({
            label: 'hudLightBindGroup',
            layout: this.hudPipeline.getBindGroupLayout(3),
            entries: [
                { binding: 0, resource: { buffer: hudLightUniformBuffer } },
            ],
        });

        const gpuObjects = {
            lightUniformBuffer,
            lightBindGroup,
            hudLightUniformBuffer,
            hudLightBindGroup,
        };
        this.gpuObjects.set(light, gpuObjects);
        return gpuObjects;
    }

    prepareTexture(texture) {
        if (this.gpuObjects.has(texture)) {
            return this.gpuObjects.get(texture);
        }

        const { gpuTexture } = this.prepareImage(texture.image); // ignore sRGB
        const { gpuSampler } = this.prepareSampler(texture.sampler);

        const gpuObjects = { gpuTexture, gpuSampler };
        this.gpuObjects.set(texture, gpuObjects);
        return gpuObjects;
    }

    prepareMaterial(material) {
        if (this.gpuObjects.has(material)) {
            return this.gpuObjects.get(material);
        }

        let baseTexture;
        if (material.baseTexture) {
            baseTexture = this.prepareTexture(material.baseTexture);
        } else {
            const texture = this.device.createTexture({
                size: { width: 1, height: 1 },
                format: 'rgba8unorm',
                usage:
                    GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
            });
            this.device.queue.writeTexture(
                { texture },
                new Uint8Array([255, 255, 255, 255]),
                {},
                { width: 1, height: 1 },
            );

            const gpuSampler = this.device.createSampler({
                minFilter: 'nearest',
                magFilter: 'nearest',
                addressModeU: 'repeat',
                addressModeV: 'repeat',
            });

            baseTexture = { gpuTexture: texture, gpuSampler };
        }

        const materialUniformBuffer = this.device.createBuffer({
            size: 32,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        const materialBindGroup = this.device.createBindGroup({
            label: 'materialBindGroup',
            layout: this.pipeline.getBindGroupLayout(2),
            entries: [
                { binding: 0, resource: { buffer: materialUniformBuffer } },
                {
                    binding: 1,
                    resource: baseTexture.gpuTexture.createView(),
                },
                { binding: 2, resource: baseTexture.gpuSampler },
            ],
        });

        const hudMaterialUniformBuffer = this.device.createBuffer({
            size: 32,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        const hudMaterialBindGroup = this.device.createBindGroup({
            label: 'hudMaterialBindGroup',
            layout: this.hudPipeline.getBindGroupLayout(2),
            entries: [
                { binding: 0, resource: { buffer: hudMaterialUniformBuffer } },
                {
                    binding: 1,
                    resource: baseTexture.gpuTexture.createView(),
                },
                { binding: 2, resource: baseTexture.gpuSampler },
            ],
        });

        const gpuObjects = {
            materialUniformBuffer,
            materialBindGroup,
            hudMaterialUniformBuffer,
            hudMaterialBindGroup,
        };
        this.gpuObjects.set(material, gpuObjects);
        return gpuObjects;
    }

    render(scene, camera) {
        if (
            this.depthTexture.width !== this.canvas.width ||
            this.depthTexture.height !== this.canvas.height
        ) {
            this.recreateDepthTexture();
        }

        const textureView = this.context.getCurrentTexture().createView();

        const encoder = this.device.createCommandEncoder();
        this.renderPass = encoder.beginRenderPass({
            colorAttachments: [
                {
                    view: textureView,
                    clearValue: [1, 1, 1, 1],
                    loadOp: 'clear',
                    storeOp: 'store',
                },
            ],
            depthStencilAttachment: {
                view: this.depthTexture.createView(),
                depthClearValue: 1,
                depthLoadOp: 'clear',
                depthStoreOp: 'discard',
            },
        });
        this.renderPass.setPipeline(this.pipeline);

        const cameraComponent = camera.getComponentOfType(Camera);
        const cameraMatrix = getGlobalModelMatrix(camera);
        const viewMatrix = getGlobalViewMatrix(camera);
        const projectionMatrix = getProjectionMatrix(camera);
        const unprojectionMatrix = mat4.invert(mat4.create(), projectionMatrix);
        const unprojectMatrix = mat4.multiply(
            mat4.create(),
            cameraMatrix,
            unprojectionMatrix,
        );
        const cameraPosition = mat4.getTranslation(vec3.create(), cameraMatrix);
        const {
            cameraUniformBuffer,
            cameraBindGroup,
            unprojectUniformBuffer,
            unprojectBindGroup,
            hudCameraUniformBuffer,
            hudCameraBindGroup,
        } = this.prepareCamera(cameraComponent);
        this.device.queue.writeBuffer(cameraUniformBuffer, 0, viewMatrix);
        this.device.queue.writeBuffer(
            cameraUniformBuffer,
            64,
            projectionMatrix,
        );
        this.device.queue.writeBuffer(cameraUniformBuffer, 128, cameraPosition);
        this.device.queue.writeBuffer(
            unprojectUniformBuffer,
            0,
            unprojectMatrix,
        );
        this.renderPass.setBindGroup(0, cameraBindGroup);

        const light = scene.find((node) => node.getComponentOfType(Light));
        const lightComponent = light.getComponentOfType(Light);
        const lightColor = vec3.scale(
            vec3.create(),
            lightComponent.color,
            lightComponent.intensity / 255,
        );
        const lightDirection = vec3.normalize(
            vec3.create(),
            lightComponent.direction,
        );
        const {
            lightUniformBuffer,
            lightBindGroup,
            hudLightUniformBuffer,
            hudLightBindGroup,
        } = this.prepareLight(lightComponent);
        this.device.queue.writeBuffer(
            lightUniformBuffer,
            0,
            new Float32Array([
                ...lightDirection,
                ...lightColor,
                lightComponent.intensity,
            ]),
        );
        // this.device.queue.writeBuffer(lightUniformBuffer, 0, lightDirection);
        // this.device.queue.writeBuffer(lightUniformBuffer, 12, lightColor);
        // this.device.queue.writeBuffer(
        //     lightUniformBuffer,
        //     24,
        //     new Float32Array([lightComponent.intensity]),
        // );
        this.renderPass.setBindGroup(3, lightBindGroup);

        this.renderNode(scene, false, false);

        this.renderPass.setPipeline(this.skyboxPipeline);
        this.renderPass.setVertexBuffer(0, this.clipQuadBuffer);
        this.renderPass.setBindGroup(0, unprojectBindGroup);
        this.renderPass.setBindGroup(1, this.skyboxBindGroup);
        this.renderPass.draw(4);

        this.renderPass.end();

        this.renderPass = encoder.beginRenderPass({
            colorAttachments: [
                {
                    view: textureView,
                    clearValue: [1, 1, 1, 1],
                    loadOp: 'load',
                    storeOp: 'store',
                },
            ],
            depthStencilAttachment: {
                view: this.depthTexture.createView(),
                depthClearValue: 1,
                depthLoadOp: 'clear',
                depthStoreOp: 'discard',
            },
        });

        this.renderPass.setPipeline(this.hudPipeline);

        this.device.queue.writeBuffer(hudCameraUniformBuffer, 0, viewMatrix);
        this.device.queue.writeBuffer(
            hudCameraUniformBuffer,
            64,
            projectionMatrix,
        );
        this.device.queue.writeBuffer(
            hudCameraUniformBuffer,
            128,
            cameraPosition,
        );

        this.renderPass.setBindGroup(0, hudCameraBindGroup);
        this.device.queue.writeBuffer(
            hudLightUniformBuffer,
            0,
            new Float32Array([
                ...lightDirection,
                ...lightColor,
                lightComponent.intensity,
            ]),
        );

        this.renderPass.setBindGroup(3, hudLightBindGroup);

        this.renderNode(scene, true, false);

        this.renderPass.end();
        this.device.queue.submit([encoder.finish()]);
    }

    renderNode(node, isHUD, forceRender, modelMatrix = mat4.create()) {
        const localMatrix = getLocalModelMatrix(node);
        modelMatrix = mat4.multiply(mat4.create(), modelMatrix, localMatrix);
        const normalMatrix = mat4.normalFromMat4(mat4.create(), modelMatrix);

        const render =
            (node.getComponentOfType(HUD) === undefined) !== isHUD ||
            forceRender;
        if (render) {
            const {
                modelUniformBuffer,
                modelBindGroup,
                hudModelUniformBuffer,
                hudModelBindGroup,
            } = this.prepareNode(node);
            this.device.queue.writeBuffer(
                isHUD ? hudModelUniformBuffer : modelUniformBuffer,
                0,
                modelMatrix,
            );
            this.device.queue.writeBuffer(
                isHUD ? hudModelUniformBuffer : modelUniformBuffer,
                64,
                normalMatrix,
            );
            this.renderPass.setBindGroup(
                1,
                isHUD ? hudModelBindGroup : modelBindGroup,
            );

            for (const model of node.getComponentsOfType(Model)) {
                this.renderModel(model, isHUD);
            }
        }

        for (const child of node.children) {
            this.renderNode(child, isHUD, render, modelMatrix);
        }
    }

    renderModel(model, isHUD) {
        for (const primitive of model.primitives) {
            this.renderPrimitive(primitive, isHUD);
        }
    }

    renderPrimitive(primitive, isHUD) {
        const material = primitive.material;
        const {
            materialUniformBuffer,
            materialBindGroup,
            hudMaterialUniformBuffer,
            hudMaterialBindGroup,
        } = this.prepareMaterial(primitive.material);
        this.device.queue.writeBuffer(
            isHUD ? hudMaterialUniformBuffer : materialUniformBuffer,
            0,
            new Float32Array([
                ...material.baseFactor,
                material.metalnessFactor,
                material.roughnessFactor,
            ]),
        );
        this.renderPass.setBindGroup(
            2,
            isHUD ? hudMaterialBindGroup : materialBindGroup,
        );

        const { vertexBuffer, indexBuffer } = this.prepareMesh(
            primitive.mesh,
            vertexBufferLayout,
        );
        this.renderPass.setVertexBuffer(0, vertexBuffer);
        this.renderPass.setIndexBuffer(indexBuffer, 'uint32');

        this.renderPass.drawIndexed(primitive.mesh.indices.length);
    }
}
