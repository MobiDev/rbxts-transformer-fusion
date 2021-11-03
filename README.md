# rbxts-transformer-fusion
This transformer adds JSX support for Fusion (https://elttob.github.io/Fusion/)

## instructions:
### Install rbxts-transformer-fusion:

``` npm i -D rbxts-transformer-fusion```

### Add rbxts-transformer-fusion as a transformer in your tsconfig.json
Also you need to add the transformer to your typeroots

```json
{
	"compilerOptions": {
		"typeRoots": ["node_modules/@rbxts","node_modules/rbxts-transformer-fusion"],
		"plugins": [
			{"transform": "rbxts-transformer-fusion"}
		]
	}
}
```

## Notes 
There are a lot of known bugs, thats why this is a beta.

If you find one that doesn't have an issue, please create one (if you can be bothered).