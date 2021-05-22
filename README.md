# prosemirror-selection-markers

[ [**CHANGELOG**](https://github.com/thomasgafner/prosemirror-selection-markers/blob/master/CHANGELOG.md) ]

This is a utility module for writing transformations for [ProseMirror](https://prosemirror.net).

This module exports schema elements and helper functions being useful when keeping track of the selection while creating composite change transformations for a ProseMirror editor.

Never ever use the schema node types provided by this module in your actual documents, that get persisted or shared in collaboration.

If it is ok for you to implement composite changes to your document as a series of commands or one command with many transformations (and many steps), then you most probably cannot benefit from this module.

Use this module when writing composite transformations preferably consisting of only one replace step.

# Motivation

If you want to implement composite changes in one atomic transformation (just one big replace step) this module can help you. You just implement the changes of the document and you need not care for the selection (cursor or head and anchor). The selection neither gets lost nor is it put at some random position nor simply at the end of the changed part of your document nor is it reduced to a simple cursor. Instead the selection remains expanded and at the most sensible position within the newly changed document.

When big parts of the document change, writing code to calculate what happens to the selection is tedious and error-prone. Using this module you can avoid that. When writing code of a composite transformation, you just write code for the document change and you need not calculate what happens to the selection.

# How it is done

The idea is:

1. At the beginning of the changes the selection is put to the document as two nodes. One for the head and one for the anchor or just one if the selection is a simple cursor.
2. You implement the changes as one fragment representing how that part of the document should be after the changes. The selection nodes get moved arround by the changes like single characters do.
3. At the end of the changes the selection nodes get removed and the actual selection is set to their positions.

Since all this happens within one transformation step and on a version of the document, that is not attached to the state, the selection marker nodes cannot make it to the actual document. The selection nodes actually get added and removed again before the one and only replace step is done on the states transaction. So the markers never appear in any transaction history nor get persisted nor shared to collaborators of the same document.

# Example

Let's write a composite transformation.

## Extend the schema by the marker node types

When setting up your schema you need to add the marker node types.

```javascript
import {addSelectionMarkersNodes} from "prosemirror-selection-markers"

const mySchema = new Schema({
  nodes: addSelectionMarkersNodes(baseSchema.spec.nodes, "inline"),
  marks: baseSchema.spec.marks
})
```

## Write your transformations

When writing your transformations use `insertSelectionMarkers` and `replaceWithAndSetSelection`.

```javascript
import {Fragment} from "prosemirror-model"
import {Transform} from "prosemirror-transform"
import {insertSelectionMarkers, replaceWithAndSetSelection} from "prosemirror-selection-markers"

function doComplicatedTransform(tr, doc, selection) {

	({doc, selection} = insertSelectionMarkers(doc, selection));

	let from, to, fragment;

	// Expand the selection to the actual range (from, to) that contains all changes.
	// Set up a fragment as replacement for that range consisting of changing and remaining nodes.
	// The code here might contain the following expressions:
	// .. = doc.slice(.., ..).content ..
	// .. = Fragment.from(doc.type.schema.nodes.my_node.create(null, ..))

	tr = replaceWithAndSetSelection(tr, fragment, from, to);

	return tr;
}
```

# License

This code is released under an
[MIT license](https://github.com/thomasgafner/prosemirror-selection-markers/tree/master/LICENSE).
