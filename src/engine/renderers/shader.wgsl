struct VertexInput {
    @location(0) position: vec3f,
    @location(1) texcoords: vec2f,
    @location(2) normal: vec3f,
}

struct VertexOutput {
    @builtin(position) clipPosition: vec4f,
    @location(0) position: vec3f,
    @location(1) texcoords: vec2f,
    @location(2) normal: vec3f,
}

struct FragmentInput {
    @location(0) position: vec3f,
    @location(1) texcoords: vec2f,
    @location(2) normal: vec3f,
}

struct FragmentOutput {
    @location(0) color: vec4f,
}

struct CameraUniforms {
    viewMatrix: mat4x4f,
    projectionMatrix: mat4x4f,
    position: vec3f,
}

struct ModelUniforms {
    modelMatrix: mat4x4f,
    normalMatrix: mat3x3f,
}

struct MaterialUniforms {
    baseFactor: vec4f,
    metalness: f32,
    roughness: f32,
    unlit: u32,
}

struct LightUniforms {
    direction: vec3f,
    color: vec3f,
}

@group(0) @binding(0) var<uniform> camera: CameraUniforms;
@group(1) @binding(0) var<uniform> model: ModelUniforms;
@group(2) @binding(0) var<uniform> material: MaterialUniforms;
@group(2) @binding(1) var baseTexture: texture_2d<f32>;
@group(2) @binding(2) var baseSampler: sampler;
@group(3) @binding(0) var<uniform> light: LightUniforms;

const PI = 3.14159265358979;
const GAMMA = 2.2;

fn F_Schlick_vec3f(f0: vec3f, f90: vec3f, VdotH: f32) -> vec3f {
    return f0 + (f90 - f0) * pow(1 - VdotH, 5.0);
}

fn F_Schlick_f32(f0: f32, f90: f32, VdotH: f32) -> f32 {
    return f0 + (f90 - f0) * pow(1 - VdotH, 5.0);
}

fn V_GGX(NdotL: f32, NdotV: f32, roughness: f32) -> f32 {
    let roughnessSq = roughness * roughness;

    let GGXV = NdotV + sqrt(NdotV * NdotV * (1 - roughnessSq) + roughnessSq);
    let GGXL = NdotL + sqrt(NdotL * NdotL * (1 - roughnessSq) + roughnessSq);

    return 1 / (GGXV * GGXL);
}

fn D_GGX(NdotH: f32, roughness: f32) -> f32 {
    let roughnessSq = roughness * roughness;
    let f = (NdotH * NdotH) * (roughnessSq - 1) + 1;
    return roughnessSq / (PI * f * f);
}

fn Fd_Burley(NdotV: f32, NdotL: f32, VdotH: f32, roughness: f32) -> f32 {
    let f90 = 0.5 + 2 * roughness * VdotH * VdotH;
    let lightScatter = F_Schlick_f32(1.0, f90, NdotL);
    let viewScatter = F_Schlick_f32(1.0, f90, NdotV);
    return lightScatter * viewScatter / PI;
}

fn BRDF_diffuse(f0: vec3f, f90: vec3f, diffuseColor: vec3f, VdotH: f32) -> vec3f {
    return (1 - F_Schlick_vec3f(f0, f90, VdotH)) * (diffuseColor / PI);
}

fn BRDF_specular(f0: vec3f, f90: vec3f, roughness: f32, VdotH: f32, NdotL: f32, NdotV: f32, NdotH: f32) -> vec3f{
    let F = F_Schlick_vec3f(f0, f90, VdotH);
    let V = V_GGX(NdotL, NdotV, roughness);
    let D = D_GGX(NdotH, roughness);
    return F * V * D;
}

fn linearTosRGB(color: vec3f) -> vec3f {
    return pow(color, vec3f(1 / GAMMA));
}

fn sRGBToLinear(color: vec3f) -> vec3f {
    return pow(color, vec3f(GAMMA));
}

@vertex
fn vertex(input: VertexInput) -> VertexOutput {
    var output: VertexOutput;

    let position = model.modelMatrix * vec4(input.position, 1);

    output.position = position.xyz;
    output.clipPosition = camera.projectionMatrix * camera.viewMatrix * position;
    output.texcoords = input.texcoords;
    output.normal = model.normalMatrix * input.normal;

    return output;
}

@fragment
fn fragment(input: FragmentInput) -> FragmentOutput {
    var output: FragmentOutput;

    let baseColor = textureSample(baseTexture, baseSampler, input.texcoords) * material.baseFactor;

    if (material.unlit != 0) {
        output.color = baseColor;
        return output;
    }

    let surfacePosition = input.position;

    let N = normalize(input.normal);
    let L = normalize(-light.direction);
    let V = normalize(camera.position - surfacePosition);
    let H = normalize(L + V);

    let NdotL = max(dot(N, L), 0.0);
    let NdotV = max(dot(N, V), 0.0);
    let NdotH = max(dot(N, H), 0.0);
    let VdotH = max(dot(V, H), 0.0);

    let f0 = mix(vec3f(0.04), baseColor.rgb, material.metalness);
    let f90 = vec3f(1);
    let diffuseColor = mix(baseColor.rgb, vec3f(0), material.metalness);

    let diffuse = light.color * NdotL * BRDF_diffuse(f0, f90, diffuseColor, VdotH);
    let specular = light.color * NdotL * BRDF_specular(f0, f90, material.roughness, VdotH, NdotL, NdotV, NdotH);

    let ambientColor = vec3f(0.08, 0.08, 0.08);
    let ambient = ambientColor * baseColor.rgb;

    let finalColor = diffuse + specular + ambient;
    output.color = vec4f(linearTosRGB(finalColor), baseColor.a);

    return output;
}