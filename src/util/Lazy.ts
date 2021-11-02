class LazyClass<T> {
	private value?: T;
	constructor(private func: () => T) {}

	get(): T {
		if (this.value !== undefined) return this.value;
		return (this.value = this.func());
	}
}

export function Lazy<T>(func: () => T): LazyClass<T> {
	return new LazyClass(func);
}
