---
sidebar_position: 1
---

# Basic Usage


## Beginner's set up for AidenLX’s Zotero Integration Plugin

This guide will distill from the [Obsidian forum thread](https://forum.obsidian.md/t/pdf-zotero-obsidian-current-state-and-collaboration-for-the-one-plugin/34372/47?u=aidenlx), the [github discussions and issues pages](https://github.com/aidenlx/obsidian-zotero/issues), the [API guide from the documentation](https://obzt.aidenlx.top/reference/api/). 

Much of the api stuff will require knowledge of [eta](https://eta.js.org) and javascript, which will not be covered in depth here, but some basics will be presented.

This will not cover [installation as that is sufficiently covered on the install page](https://obzt.aidenlx.top/getting-started/install/) as well as some straightforward things such as predefined folder settings, and other misc.

## Explanation of features
Besides creating notes with data imported from Zotero, what we call “Literature Notes”, the plugin has several features for research. Namely two toolbars, the ***Fields of Literature Note Panel***, and the ***Annotations Panel.***

### Fields of Literature Note Panel
Starting with the ***Fields of Literature Note Panel***, this is a panel which is linked to the active pane, and will show you the content of yaml metadata frontmatter fields (which must be specified in the plugins settings). Additionally, you may add new entries into these fields from this panel. The default fields specified are *highlights*, and *annotations*. You may add additional fields to be shown in this view by going to the plugin settings, and selecting the `fields` tab.

### Annotations Panel
The **Annotations Panel** is more complex. The key purpose of this panel is to show annotations made in zotero In the side panel. There are four options here, a “collapse” (shortens the annotation cards), a “refresh” (refreshes data from zotero), “Choose Follow Mode”, and “Show Details”. 

The *Choose Follow Mode*, links the annotations panel to either: a selected literature (chosen from a list), the literature note in an active panel, or the “active literature in zotero reader” (I wasn’t able to make this one work). 

Lastly, there is the *Show Details* mode, which for a linked literature, will display the available metadata fields from zotero (this is supposed to show inside the panel, but it may open in a new Obsidian window altogether). These can also be found by opening the betterbibtex database `.json` file. These fieldnames are what you will use when making your templates, as will be explained below.



## Templates

Currently, the templating framework is divided into several parts. Yaml metadata fields, are not incorporated into the customizable template files, and are instead edited from the `Template` tab in the settings under the **Metadata Fields** header. Here you may choose what metadata you want to be imported from zotero and into the yaml fields. You may also choose to customize the fieldname printed in the Literature Note to something other than what it is in zotero with the `Specify Alias Here` text-field. Fields which do not exist in zotero, will not be created in the template, and ***it is not possible to define custom non-zotero yaml fields*** I.e. fields which you may want for obsidian, such as `status` or `priority`. Not a big issue if you are a fan of dataview inline fields.

The plugin uses predefined default templates, until they are “ejected” to a defined folder. This is done in the `Template` tab in the settings, after which the template files may be customized. By default these `zt-note.eta`, `zt-annot.eta`, and the similarly named `zt-annots.eta`. The way this works is by first referring to the *note* template: `zt-note.eta`, which then references `zt-annots.eta` a separate template for how to create multiple annotations and references `zt-annot.eta` which defines the template for each individual annotation.

Below I have copied the default templates and describe the behavior in comments.

``` zt-note.eta
# <%= it.title %> \\ Insert title from zotero metadata
\n              \\ New line break
[zotero](<%= it.backlink %>) <%= it.fileLink %> \\ Creating a markdown link "[]()" which links to the           zotero URI, and then a link to the file location 
\n              \\ New line break
<%~ include("annots", it.annotations) %> \\ Reference to insert "annots" template (kinda iffy here)
```


``` zt-annots.eta
\\ Super unsure to the format of things here
<% for (const annotation of it) { %> \\Probably a "for all annotations in item" 
<%~ include("annotation", annotation) %> \\ Make a an individual annotation item from zt-annot.eta, I don't see how it is referenceing that template file exactly
\n \\ newline break
<% } %> \\ Exit for loop?
```


``` zt-annot.eta
[!note] Page <%= it.pageLabel %> \\ Makes an admontion with the page number
<%= it.imgEmbed %> \\ Embeds image if one
<%= it.text %> \\ Text selected of annotation

<% if (it.comment) { %> \\ if loop for comments on annotation
---
<%= it.comment %> \\ insert annotation comment
<% } %> \\exit if loop
```


### Syntax Cheat Sheet
Immediately we can see how inserting information works:

`<% %>` Anyone familiar with the templater plugin will recognize this as representing a dynamic field, i.e. the information to be automatically pulled. 

`<%= it.fieldname %>` appears to be how one sets in information from a field in zotero where `it.` stands for the “item” (so don’t change this) and `fieldname` is the zotero field from which the information in pulled. Just swap the fieldname with the desired zotero fields, as shown in the *Show Details* panel or the `.json` file.

<% for { %> and `<% if {%>` appears to serve as a dynamic function, for a *for* and *if* loop respectively. End of statement needs to be ended with a `<% } %>`. As seen in <% if (it.comment) { %> and <% for (const annotation of it) { %>.

`<%~  %>` appears to be some dynamic function, as seen in  <%~ include("annotation", annotation) %>. which calls to  `zt-annots.eta`  but this is at the limit of my understanding. 


### Fields Cheat Sheet

`<%= it.title %>` paper title

`<%= it.date %>` year

`<%= it.backlink %>` Zotero URI

`<%= it.fileLink %>` Zotero PDF file path

`<%= it.abstractNote %>` insert abstract

#### Bonus - How to shorten author names to et al
[As taken from this thread here](https://github.com/aidenlx/obsidian-zotero/discussions/120), this uses the js/eta language to format the authors names as “first author et al. Year” when more than one author is listed.
```
<%= it.creators.first()?.lastName %>
<% if (it.creators.length > 1) { %> et al. <% } %>
- <%= it.date %> - <%= it.title %>
```

## Final
This should be enough to customize some simple templates. If you have any information that would work well here please reach out on the reddit or forum threads linking here, and I will try to incorporate it. 

Additionally please check out AidenLX’s [github](https://github.com/aidenlx/obsidian-zotero) or donate to his[patreon](https://patreon.com/aidenlx). 

Also, perhaps check out this [Obsidian forum thread here](https://forum.obsidian.md/t/obsidian-zotero-import-templates/56901/) for more AZP template discussion.
