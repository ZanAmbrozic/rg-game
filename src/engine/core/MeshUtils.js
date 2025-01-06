import { vec3, mat3 } from 'gl-matrix';

export function transformVertex(
    vertex,
    matrix,
    normalMatrix = mat3.normalFromMat4(mat3.create(), matrix),
    tangentMatrix = mat3.fromMat4(mat3.create(), matrix),
) {
    vec3.transformMat4(vertex.position, vertex.position, matrix);
    vec3.transformMat3(vertex.normal, vertex.normal, normalMatrix);
    vec3.transformMat3(vertex.tangent, vertex.tangent, tangentMatrix);
}

export function transformMesh(
    mesh,
    matrix,
    normalMatrix = mat3.normalFromMat4(mat3.create(), matrix),
    tangentMatrix = mat3.fromMat4(mat3.create(), matrix),
) {
    for (const vertex of mesh.vertices) {
        transformVertex(vertex, matrix, normalMatrix, tangentMatrix);
    }
}

/**
 * @param {Mesh} mesh
 * @returns {{min: vec3, max: vec3}}
 */
export function calculateAxisAlignedBoundingBox(mesh) {
    const initial = {
        min: vec3.clone(mesh.vertices[0].position),
        max: vec3.clone(mesh.vertices[0].position),
    };

    return {
        min: mesh.vertices.reduce(
            (a, b) => vec3.min(a, a, b.position),
            initial.min,
        ),
        max: mesh.vertices.reduce(
            (a, b) => vec3.max(a, a, b.position),
            initial.max,
        ),
    };
}

export function mergeAxisAlignedBoundingBoxes(boxes) {
    const initial = {
        min: vec3.clone(boxes[0].min),
        max: vec3.clone(boxes[0].max),
    };

    return {
        min: boxes.reduce(
            ({ min: amin }, { min: bmin }) => vec3.min(amin, amin, bmin),
            initial,
        ),
        max: boxes.reduce(
            ({ max: amax }, { max: bmax }) => vec3.max(amax, amax, bmax),
            initial,
        ),
    };
}

/**
 * Interpolates y coordinate between 3 vertices
 * @param {number[3]} p
 * @param {number[3]} v1
 * @param {number[3]} v2
 * @param {number[3]} v3
 * @returns {number|null} Interpolated Y or null if point is outside the triangle
 */
export function interpolateY(p, v1, v2, v3) {
    const w1 =
        ((v2[2] - v3[2]) * (p[0] - v3[0]) + (v3[0] - v2[0]) * (p[2] - v3[2])) /
        ((v2[2] - v3[2]) * (v1[0] - v3[0]) + (v3[0] - v2[0]) * (v1[2] - v3[2]));
    const w2 =
        ((v3[2] - v1[2]) * (p[0] - v3[0]) + (v1[0] - v3[0]) * (p[2] - v3[2])) /
        ((v2[2] - v3[2]) * (v1[0] - v3[0]) + (v3[0] - v2[0]) * (v1[2] - v3[2]));
    const w3 =
        ((v1[2] - v2[2]) * (p[0] - v1[0]) + (v2[0] - v1[0]) * (p[2] - v1[2])) /
        ((v2[2] - v3[2]) * (v1[0] - v3[0]) + (v3[0] - v2[0]) * (v1[2] - v3[2]));

    if (w1 < 0 || w2 < 0 || w3 < 0) {
        return null;
    }

    return v1[1] * w1 + v2[1] * w2 + v3[1] * w3;
}
