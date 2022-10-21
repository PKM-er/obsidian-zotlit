

# [0.4.0](https://github.com/aidenlx/obsidian-zotero/compare/0.3.1...0.4.0) (2022-10-21)


### Bug Fixes

* **obsidian/template:** fix template file fail to load on obsidian init ([5e3e406](https://github.com/aidenlx/obsidian-zotero/commit/5e3e406b9cbec136e75743e01d0f6b1e1eb3bba8))


### Features

* **docs:** scallfold for document website ([9bad04e](https://github.com/aidenlx/obsidian-zotero/commit/9bad04edaf1dd7b7d4de1161acca67702eb06f63))
* **obsidian/annot-view:** fields with hex color is now rendered with background in item details ([9b6a287](https://github.com/aidenlx/obsidian-zotero/commit/9b6a287a956db8c55a66f0e9a57712c88c324034))
* **obsidian/annot-view:** item details for annot now shows helper values ([f561479](https://github.com/aidenlx/obsidian-zotero/commit/f561479944fcff8cd494b0ea3631bff4e25bd198))
* **obsidian/annot-view:** item details for annot now shows meaning of enum `type` ([1dff520](https://github.com/aidenlx/obsidian-zotero/commit/1dff5201a7af6f67fb1f96543f2a242d6a9c8d4e))
* **obsidian/annot-view:** item details for docItem now shows helper values ([ab6a18c](https://github.com/aidenlx/obsidian-zotero/commit/ab6a18cc0281b4396c330a87b93df636056983b2))
* **obsidian/annot-view:** update template helper for eta ([710ff5b](https://github.com/aidenlx/obsidian-zotero/commit/710ff5bd8fd61fd0511c0ae5a7c5b9bdbec4f078))
* **obsidian/template:** add annot helper to get color name ([7e1b2c8](https://github.com/aidenlx/obsidian-zotero/commit/7e1b2c8f8fd32aaba2f1a68a1af70f62696d2fe8))
* **obsidian/template:** add auto recomplie for template file; add notice for template complie error ([a047a73](https://github.com/aidenlx/obsidian-zotero/commit/a047a739e04a8ff5588bfb220d00f813ca0a117c))
* **obsidian/template:** basic editor helper for eta template ([ca121a1](https://github.com/aidenlx/obsidian-zotero/commit/ca121a17dca805c92990de3172f691e34cfe6d6b))
* **obsidian/template:** complex template can now be ejected into template files ([b21a915](https://github.com/aidenlx/obsidian-zotero/commit/b21a915733a7f406ecc4525edadebe04bd8f6e57)), closes [#52](https://github.com/aidenlx/obsidian-zotero/issues/52)
* **obsidian/template:** migrate from handlebars to eta ([1bb5f24](https://github.com/aidenlx/obsidian-zotero/commit/1bb5f24d08832972d8c64712babbd6f54df6d1fb))

## [0.3.1](https://github.com/aidenlx/obsidian-zotero/compare/0.3.0...0.3.1) (2022-10-18)


### Bug Fixes

* **obsidian:** fix out-of-date better-sqlite3 version ([3270ca8](https://github.com/aidenlx/obsidian-zotero/commit/3270ca87f1310d547a3295b40961c51a6658f629))

# [0.3.0](https://github.com/aidenlx/obsidian-zotero/compare/0.2.0...0.3.0) (2022-10-18)


### Bug Fixes

* **lib/database:** attachments no longer return nullable itemID ([11fcff7](https://github.com/aidenlx/obsidian-zotero/commit/11fcff787b6a8d58544858e2ebbab991456cf01b))
* **lib/database:** creators and item fields no longer include one with null itemID ([138d4b5](https://github.com/aidenlx/obsidian-zotero/commit/138d4b5549e2dcdf979b848c70fbab8218eaeab1))
* **lib/database:** database now exclude items without itemID ([d36603d](https://github.com/aidenlx/obsidian-zotero/commit/d36603d0f1cd4acfb798ab8e67eeee5eb1257e27))
* **lib/database:** error inside database worker can now be logged with proper sourcemap ([ba23b1f](https://github.com/aidenlx/obsidian-zotero/commit/ba23b1fcba3a9e3f4f244c8acb4aa8b5d615ab05))
* **lib/database:** fix attachment query ambiguous itemID ([7771855](https://github.com/aidenlx/obsidian-zotero/commit/77718557c131c9a67fb3b25614bd418251c44596))
* **lib/database:** fix getTags() return empty entry instead of empty array if item has no tag ([e45d4d3](https://github.com/aidenlx/obsidian-zotero/commit/e45d4d39a31147ccb6a8af84583fbe2e2a95aec7))
* **lib/database:** fix itemData only return first value if there are multiple values ([2956467](https://github.com/aidenlx/obsidian-zotero/commit/2956467714dec5c006cc1566fe8e9a2ffd970b04))
* **obsidian/annot-block:** handle fallback for `annot-block` when db is not available ([bb05b01](https://github.com/aidenlx/obsidian-zotero/commit/bb05b016079b2f9a96af1e092044a3db8a3b7c78)), closes [#42](https://github.com/aidenlx/obsidian-zotero/issues/42)
* **obsidian/annot-view:** auto refresh will now skip if database hasn't changed ([21f43fe](https://github.com/aidenlx/obsidian-zotero/commit/21f43fe08cb3fb333a13d1bcbf874ef4236a21ab))
* **obsidian/annot-view:** fix annot excerpt and comment not selectable ([20a4e1e](https://github.com/aidenlx/obsidian-zotero/commit/20a4e1efbf8021b02a66794822554bd21e42819a))
* **obsidian/annot-view:** fix annotation item not refreshed ([c8f5be0](https://github.com/aidenlx/obsidian-zotero/commit/c8f5be09ff113b0ddc3ec48516189bee51b34f7f)), closes [#36](https://github.com/aidenlx/obsidian-zotero/issues/36)
* **obsidian/annot-view:** fix tags container not hidden when no tag available ([60c4dbc](https://github.com/aidenlx/obsidian-zotero/commit/60c4dbc11cf284cc8e20c968f4b3898d461a3ed5)), closes [#15](https://github.com/aidenlx/obsidian-zotero/issues/15)
* **obsidian/annot-view:** manual refresh no longer triggers full re-render ([e7d5833](https://github.com/aidenlx/obsidian-zotero/commit/e7d58336095b8aad2ed738abfcaf7cb45bff6ad8))
* **obsidian/note-index:** fix note index unable to handle multiple items in same file ([27e702a](https://github.com/aidenlx/obsidian-zotero/commit/27e702a14ac465ae896930dd82cd81b846206b59))
* **obsidian/setting-tab:** react component is now properly unmounted ([802f2cc](https://github.com/aidenlx/obsidian-zotero/commit/802f2cc58b9d37f1af5c0d19faf3a18390753169))
* **obsidian/suggester:** fix title cannot be rendered in suggester ([09af2b2](https://github.com/aidenlx/obsidian-zotero/commit/09af2b21ec25f45115b3b2d59b3f5e036aa260b9))
* **obsidian/template:** image embed inserted when annotation type is not image ([#29](https://github.com/aidenlx/obsidian-zotero/issues/29)) ([9705574](https://github.com/aidenlx/obsidian-zotero/commit/970557424c6a6e924ee8797a9cdb03ea0989dbf4))
* **obsidian/zotero-db:** fix set auto refresh exec refresh database before init ([2980eb3](https://github.com/aidenlx/obsidian-zotero/commit/2980eb378e7bd2141f70238ad762a4f94d8a0b92))
* **obsidian:** fix note index store invaild key for annotations ([427637a](https://github.com/aidenlx/obsidian-zotero/commit/427637a21500a97419aa4ccb4e8f738b35ebe146))
* use custom version of workerpool to support worker name and error log inside worker ([8b6b2e4](https://github.com/aidenlx/obsidian-zotero/commit/8b6b2e4b2d2c628196b14aa98526f9712cf1c4fc))
* **zotero-type:** page param of annotation url is now generated  `position.pageIndex` ([#28](https://github.com/aidenlx/obsidian-zotero/issues/28)) ([bf47c9a](https://github.com/aidenlx/obsidian-zotero/commit/bf47c9afed323289e9ba43f8635ce2fd84cbadd1))


### Features

* **lib/database:** add function to check if database is up-to-date ([d18b543](https://github.com/aidenlx/obsidian-zotero/commit/d18b543fa27902da33adaa8baa2e3fa09daa7d8a))
* **lib/database:** add function to perform raw query against main zotero database ([c03f15b](https://github.com/aidenlx/obsidian-zotero/commit/c03f15b4140565333e13175afc48af04cb19ac70))
* **lib/note-parser:** initial support ([e54581f](https://github.com/aidenlx/obsidian-zotero/commit/e54581fd3b3d8e38fc90788be629c9173ab760d2))
* **obsidian/annot-block:** implement `zotero-annot` code block ([#38](https://github.com/aidenlx/obsidian-zotero/issues/38)) ([2221249](https://github.com/aidenlx/obsidian-zotero/commit/22212498c4eb9b1ffaa7989c573f298c69e6cc6a))
* **obsidian/annot-view:** add button to copy item details in JSON code block ([2dce791](https://github.com/aidenlx/obsidian-zotero/commit/2dce791c89fa55ef5d103b6a16dd736a824fb14c))
* **obsidian/annot-view:** add button to show details of annotation ([01a93e8](https://github.com/aidenlx/obsidian-zotero/commit/01a93e86834bc28fe0b7acb651128af2f2fe2d28))
* **obsidian/annot-view:** add drag image for dnd ([#26](https://github.com/aidenlx/obsidian-zotero/issues/26)) ([2908a72](https://github.com/aidenlx/obsidian-zotero/commit/2908a72e458c6e59775b793257a350fefa8edf3f))
* **obsidian/annot-view:** add more option menu for annot item ([058856c](https://github.com/aidenlx/obsidian-zotero/commit/058856cabf6250f22beb995df85f720d2c828a5e))
* **obsidian/annot-view:** add option to collapse/expand list item ([ab64749](https://github.com/aidenlx/obsidian-zotero/commit/ab64749d31bed28e2e4bfaa53f0c976da96d6112))
* **obsidian/annot-view:** add option to copy template with {{#if}} if field is nullable ([7060cf2](https://github.com/aidenlx/obsidian-zotero/commit/7060cf288130005d6b62020a0cc227a568dc34e2))
* **obsidian/annot-view:** add tags in `AnnotationPreview` ([7864569](https://github.com/aidenlx/obsidian-zotero/commit/78645691c7b21be9673acdeff0e4dd140e7dcff2))
* **obsidian/annot-view:** add util to generate template that pick first element in array ([93eb26e](https://github.com/aidenlx/obsidian-zotero/commit/93eb26efc7543482ea1b8eea79e1b6f957c22d45))
* **obsidian/annot-view:** add utils to copy template string from item details ([1a83b1a](https://github.com/aidenlx/obsidian-zotero/commit/1a83b1af7982397ee16d6e333d59a6097dbd5092))
* **obsidian/annot-view:** adjust `ItemDetails` to show more details about new props ([4158d8b](https://github.com/aidenlx/obsidian-zotero/commit/4158d8b1ca6aa8f00d268e7ec42660b870e2dfc1))
* **obsidian/annot-view:** adjust style of .annot-header ([80c77e2](https://github.com/aidenlx/obsidian-zotero/commit/80c77e28064c1c5b973f1aaf5e7192deef493a02))
* **obsidian/annot-view:** adjust style of annotation toolbar ([9a04064](https://github.com/aidenlx/obsidian-zotero/commit/9a0406476f47cea1d2ea10e823961ba6a152a3d7))
* **obsidian/annot-view:** attachment select option can presist ([6e6576e](https://github.com/aidenlx/obsidian-zotero/commit/6e6576e3ec737036c3f473d23c358baab4edde5e))
* **obsidian/annot-view:** implement `FileView` ([f9175a4](https://github.com/aidenlx/obsidian-zotero/commit/f9175a4c48468810ce9c3f117b70d082cdd40d14)), closes [#8](https://github.com/aidenlx/obsidian-zotero/issues/8) [#35](https://github.com/aidenlx/obsidian-zotero/issues/35)
* **obsidian/annot-view:** item details are now expanded properly on start ([fec0b9d](https://github.com/aidenlx/obsidian-zotero/commit/fec0b9dbb2ab316d3678154641f98fc64e1ecb46))
* **obsidian/annot-view:** jump from annotation to note (heading) ([c296d2f](https://github.com/aidenlx/obsidian-zotero/commit/c296d2fe04608596cc0f5273b4381c102f035127)), closes [#34](https://github.com/aidenlx/obsidian-zotero/issues/34)
* **obsidian/annot-view:** option to auto refresh on focus ([5cdf532](https://github.com/aidenlx/obsidian-zotero/commit/5cdf532ca103dc2d299e273c6ebf0736613030fb))
* **obsidian/annot-view:** show notice when manual refresh is done ([1f7b2e4](https://github.com/aidenlx/obsidian-zotero/commit/1f7b2e48d5f44cdafd16a4f733a60d65b8e62a7a))
* **obsidian/annot-view:** support drag annotation into editor ([38813b7](https://github.com/aidenlx/obsidian-zotero/commit/38813b706ae5714da782551a7efeb741e206d7d2))
* **obsidian/annot-view:** view zotero item details ([e26c1e4](https://github.com/aidenlx/obsidian-zotero/commit/e26c1e42a5b4232cf80c958629c8e6d76849ca0b))
* **obsidian/template:** add commentMd helper ([321e910](https://github.com/aidenlx/obsidian-zotero/commit/321e910fd36f5ff3f6722c28440c584dbcbef287))
* **obsidian/template:** add helper to insert link to attachment ([51ac516](https://github.com/aidenlx/obsidian-zotero/commit/51ac51654e303b90d1721ca32b929c998ec28963)), closes [#23](https://github.com/aidenlx/obsidian-zotero/issues/23)
* **obsidian/template:** filename template no longer need to be warpped by `{{#filename}}` ([cbc9200](https://github.com/aidenlx/obsidian-zotero/commit/cbc9200ed51caa9d10b830af97d5d36ff523a3ed))
* **obsidian/template:** helper for creator ([1b0fb68](https://github.com/aidenlx/obsidian-zotero/commit/1b0fb68547836734a4f76f239a1870e70d70bae4)), closes [#27](https://github.com/aidenlx/obsidian-zotero/issues/27)
* **obsidian/template:** support import note with annotations and attachment ([dc5b608](https://github.com/aidenlx/obsidian-zotero/commit/dc5b60847abab799a025ec0ae118b34f59fb575d))
* **obsidian/template:** template support for image excerpt ([be86bc5](https://github.com/aidenlx/obsidian-zotero/commit/be86bc5429d936d25de2c39b39fc66c69269f6ed))
* **obsidian/template:** template support for tags of annotation ([b199b38](https://github.com/aidenlx/obsidian-zotero/commit/b199b3868391a5e309274263b2c89b558a7b36f9))
* **obsidian/zotero-db:** auto init index before calling related function ([3915447](https://github.com/aidenlx/obsidian-zotero/commit/3915447481114f3e368be77b7a921868f293b06b))
* **obsidian:** add option for zotero-db to auto refresh on db updates ([04d4586](https://github.com/aidenlx/obsidian-zotero/commit/04d4586e1c2572caa9c2b6fb44e151b1ba834263))
* **obsidian:** add util to parse pdf outline using mutool ([1c93406](https://github.com/aidenlx/obsidian-zotero/commit/1c93406282c40097d75bbd0c385229a155bc0691))
* **obsidian:** cache for PDF outline ([f3587a2](https://github.com/aidenlx/obsidian-zotero/commit/f3587a2b03a1345101da7dd4c482f6dc88265e98))
* **obsidian:** prompt for reset if binary failed to load ([dbbc557](https://github.com/aidenlx/obsidian-zotero/commit/dbbc557854355ab7b026fc59754b14303a834b69))
* **obsidian:** redesign install guide ([ec9dbae](https://github.com/aidenlx/obsidian-zotero/commit/ec9dbae89184867bc3acaaf2a10ae2e88385d28b))

# [0.2.0](https://github.com/aidenlx/obsidian-zotero-plugin/compare/0.1.1...0.2.0) (2022-10-01)


### Bug Fixes

* **lib/database:** fix attchament and annotation query ([daf4803](https://github.com/aidenlx/obsidian-zotero-plugin/commit/daf4803fa619b5b6294c1488e32277f26887ecf8))
* **lib/database:** itemKeyIndex now store key generated by getItemKeyGroupID ([a68a15e](https://github.com/aidenlx/obsidian-zotero-plugin/commit/a68a15e2e2e11acb818b51be211e8cd18aeb7fd0))
* **lib/zotero-type:** fix type def for creator; remove redundant type in @obzt/database ([45d609f](https://github.com/aidenlx/obsidian-zotero-plugin/commit/45d609fa536e7220ede59d6d6a17f0f5bbefa7b7))
* **obsidian:** downgrade to react 17 to avoid freeze on unmount while suspensing ([8fcebf5](https://github.com/aidenlx/obsidian-zotero-plugin/commit/8fcebf5afeab9e6f1f93928d96550a0e18c2b27c))
* **obsidian:** fix annot side panel failed to load on start ([8225497](https://github.com/aidenlx/obsidian-zotero-plugin/commit/8225497dd95f723395eaad408dcd3d1d56f46a0e))
* **obsidian:** fix annot view only get partially refreshed ([1d0df2c](https://github.com/aidenlx/obsidian-zotero-plugin/commit/1d0df2c7d5199b50c62a624edd8ca169ee06c03a))
* **obsidian:** fix inconsistent use of getItemKeyGroupID ([f4a8d17](https://github.com/aidenlx/obsidian-zotero-plugin/commit/f4a8d17b3e39424f2bff1c677171db178fd4f72b))


### Features

* **lib/database:** add function to get item with id or key ([98a5854](https://github.com/aidenlx/obsidian-zotero-plugin/commit/98a5854b213bbe425c6b42fa4d9b9a86b6348f48))
* **lib/database:** add function to get tags ([042165d](https://github.com/aidenlx/obsidian-zotero-plugin/commit/042165d265b11c1c3ec19ca242fe739ebab1b204))
* **lib/database:** add functions to getAnnotations and getAttachments ([55d9d90](https://github.com/aidenlx/obsidian-zotero-plugin/commit/55d9d90887d0719c12658eb3685d026e4b98db1c))
* **lib/database:** annotation now return attachment's id and key ([39ae46f](https://github.com/aidenlx/obsidian-zotero-plugin/commit/39ae46ff788eede27a24deb8ed954675c583fe79))
* **obsidian/annot-view:** improve handling case where active file not literature note ([eca6d95](https://github.com/aidenlx/obsidian-zotero-plugin/commit/eca6d95249bca7a0792231739fe7b609905a2051))
* **obsidian:** add file-itemkey map to note-index ([52cf5b0](https://github.com/aidenlx/obsidian-zotero-plugin/commit/52cf5b07a10e0a8eb1cbc26207148ac13109e725))
* **obsidian:** add modals to import annotations from zotero ([402c16f](https://github.com/aidenlx/obsidian-zotero-plugin/commit/402c16f08b6fc938099f99b2c62e3dd4343d8ba8))
* **obsidian:** add quick switcher to create literature note ([34d6135](https://github.com/aidenlx/obsidian-zotero-plugin/commit/34d6135e48d124b750b6ca550347d60e9d9e1f18))
* **obsidian:** click on page of annot header can now jump to zotero ([3017f33](https://github.com/aidenlx/obsidian-zotero-plugin/commit/3017f33899c6c1dd83b9b0c31ab54480c16f9589))
* **obsidian:** zotero annotation side panel ([0de85c6](https://github.com/aidenlx/obsidian-zotero-plugin/commit/0de85c640972d7e1e636f9bdb1554ac8dae6ac5a))

## [0.1.1](https://github.com/aidenlx/obsidian-zotero-plugin/compare/0.1.0...0.1.1) (2022-09-26)


### Bug Fixes

* **obsidian:** fix esbuild enable node compatibility mode in obsidian plugin ([e56e8e4](https://github.com/aidenlx/obsidian-zotero-plugin/commit/e56e8e4a8dcdfad46673a9dc884ccb10fa67270e))

# 0.1.0 (2022-09-26)

Initial release