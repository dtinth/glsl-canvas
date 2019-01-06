import { Texture } from './textures';

export class Uniform {
	method: string;
	type: string;
	key: string;
	values: any[];
	location?: WebGLUniformLocation;
	dirty?: boolean = true;
	apply?: Function;

	constructor(options?: Uniform) {
		if (options) {
			Object.assign(this, options);
		}
		this.apply = (gl: WebGLRenderingContext, program: WebGLProgram) => {
			if (this.dirty) {
				gl.useProgram(program);
				const method = 'uniform' + this.method;
				const location = gl.getUniformLocation(program, this.key);
				(gl as any)[method].apply(gl, [location].concat(this.values));
			}
		}
	}

	static isDifferent(a: any, b: any): boolean {
		if (a && b) {
			return a.toString() !== b.toString();
		}
		return false;
	}

	/*
	set?(gl: WebGLRenderingContext, program: WebGLProgram, ...values: any) {
		let dirty = false;
		// remember and keep track of uniforms location to save calls
		if (!this.location || !this.values || Uniform.isDifferent(this.values, values)) {
			dirty = true;
		}
		return dirty;
	}
	*/

}

export class UniformTexture extends Uniform {

	texture: Texture;

	constructor(options?: Uniform) {
		super(options);
	}

}

export default class Uniforms extends Map<string, Uniform> {

	dirty: boolean = false;

	static isArrayOfNumbers(array: any[]): boolean {
		return array.reduce((flag: boolean, value: any) => {
			return flag && typeof value === 'number';
		}, true)
	}

	static parseUniform(key: string, ...values: any[]): Uniform {
		const value = values.length === 1 ? values[0] : values;
		let uniform: Uniform;
		// console.log(key, value);
		// Single float
		if (typeof value === 'number') {
			uniform = new Uniform({
				type: 'float',
				method: '1f',
				key: key,
				values: [value]
			});
		} else if (typeof value === 'boolean') {
			// Boolean
			uniform = new Uniform({
				type: 'bool',
				method: '1i',
				key: key,
				values: [value]
			});
		} else if (Texture.isTexture(value)) {
			// Texture
			uniform = new Uniform({
				type: 'sampler2D',
				method: '1i',
				key: key,
				values: value // !!!
			});
		} else if (Array.isArray(value)) {
			// Array: vector, array of floats, array of textures, or array of structs
			// Numeric values
			if (Uniforms.isArrayOfNumbers(value)) {
				// float vectors (vec2, vec3, vec4)
				if (value.length === 1) {
					uniform = new Uniform({
						type: 'float',
						method: '1f',
						key: key,
						values: value
					});
				} else if (value.length >= 2 && value.length <= 4) {
					// float vectors (vec2, vec3, vec4)
					uniform = new Uniform({
						type: 'vec' + value.length,
						method: value.length + 'fv',
						key: key,
						values: value
					});
				} else if (value.length > 4) {
					// float array
					uniform = new Uniform({
						type: 'float[]',
						method: '1fv',
						key: key,
						values: value
					});
				}
				// TODO: assume matrix for (typeof == Float32Array && length == 16)?
			} else if (Texture.getTextureOptions(value[0])) {
				// Array of textures
				uniform = new Uniform({
					type: 'sampler2D',
					method: '1iv',
					key: key,
					values: value
				});
			} else if (Array.isArray(value[0]) && typeof value[0][0] === 'number') {
				// Array of arrays - but only arrays of vectors are allowed in this case
				// float vectors (vec2, vec3, vec4)
				if (value[0].length >= 2 && value[0].length <= 4) {
					// Set each vector in the array
					for (let u = 0; u < value.length; u++) {
						uniform = new Uniform({
							type: 'vec' + value[0].length,
							method: value[u].length + 'fv',
							key: key + '[' + u + ']',
							values: value[u]
						});
					}
				}
				// else error?
			} else if (typeof value[0] === 'object') {
				// Array of structures
				for (let u = 0; u < value.length; u++) {
					// Set each struct in the array
					// !!! uniform = new Uniform(...Uniforms.parseUniforms(value[u], key + '[' + u + ']'));
				}
			}
		} else if (typeof value === 'object') {
			// Structure
			// Set each field in the struct
			// !!! uniform = new Uniform(...Uniforms.parseUniforms(value, key));
		}
		// TODO: support other non-float types? (int, etc.)
		return uniform;
	}

	static parseUniforms(values: any, prefix?: string): Map<string, Uniform> {
		const uniforms = new Map<string, Uniform>();
		for (let key in values) {
			const value = values[key];
			if (prefix) {
				key = prefix + '.' + key;
			}
			const uniform: Uniform = Uniforms.parseUniform(key, value);
			if (uniform) {
				uniforms.set(key, uniform);
			}
		}
		return uniforms;
	}

	setParse(key: string, ...values: any[]): Uniform {
		const uniform: Uniform = Uniforms.parseUniform(key, ...values);
		if (uniform) {
			this.set(key, uniform);
		}
		return uniform;
	}

	create(method: string, type: string, key: string, ...values: any[]): Uniform {
		const uniform = new Uniform({
			method: method,
			type: type,
			key: key,
			values: values,
		});
		this.set(key, uniform);
		this.dirty = true;
		return uniform;
	}

	createTexture(key: string, index: number): UniformTexture {
		const uniform = new UniformTexture({
			method: '1i',
			type: 'sampler2D',
			key: key,
			values: [index],
		});
		this.set(key, uniform);
		this.dirty = true;
		return uniform;
		// const uniform = this.setParse(key, url) as UniformTexture; // !!!
		// console.log(uniform.type, key, url);
		/*
		if (uniform.type === 'sampler2D') {
			// console.log(u, uniform);
			// For textures, we need to track texture units, so we have a special setter
			// this.uniformTexture(uniform.key, uniform.value[0]);
			if (uniform.method === '1iv') {
				// todo
				uniform.values.map((
					urlElementOrData: string | HTMLCanvasElement | HTMLImageElement | HTMLVideoElement | Element | TextureData,
					i: number
				) => this.uniformTexture(uniform.key + i, urlElementOrData));
			} else {
				this.uniformTexture(uniform.key, uniform.values[0]);
			}
		}
		*/
		return uniform;
	}

	update(method: string, type: string, key: string, ...values: any[]) {
		const uniform = this.get(key);
		if (uniform &&
			(uniform.method !== method ||
				uniform.type !== type ||
				uniform.values !== values
			)) {
			uniform.method = method;
			uniform.type = type;
			uniform.values = values;
			uniform.dirty = true;
			this.dirty = true;
		}
	}

	createOrUpdate(method: string, type: string, key: string, ...values: any[]) {
		if (this.has(key)) {
			this.update(method, type, key, ...values);
		} else {
			this.create(method, type, key, ...values);
		}
	}

	apply(gl: WebGLRenderingContext, program: WebGLProgram) {
		this.forEach(uniform => uniform.apply(gl, program));
	}

}
