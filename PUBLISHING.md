# Publishing to our npm registry

Things to check before publishing:
- any newly added source files which are to be included in the package have been added to "files" list in `package.json`
- `version` in `package.json` has been updated appropriately

From nix shell:
```sh
npm-publish
```
