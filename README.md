# prosemirror-selection-markers

[ [**CHANGELOG**](https://github.com/thomasgafner/prosemirror-selection-markers/blob/master/CHANGELOG.md) ]

This is a utility module for writing transforms for [ProseMirror](https://prosemirror.net).

This module exports schema elements and utility functions for transforms that help keeping track of the selection in complicated transforms for a ProseMirror editor.

Never ever use the schema node types provided by this module in your actual documents, that get persisted or shared in collaboration.

If it is ok for you to implement complicated changes to your document as a series of commands or one command with many transforms (steps), then you most probably cannot benefit from this module.

# Motivation

If you want to implement complicated changes in one atomic transform (just one big replace step) this module can help you. You just implement what changes  the document and you need not care for the selection (cursor or head and anchor). The selection neither gets lost nor is put at some random position nor reduced to a simple cursor. The selection remains expanded and at the most sensible position within the newly changed document.

Writing code to calculate what happens to the selection is tedious and error-prone. Using this module you can avoid that. When writing code of a complicated transform, you just write code for the document change and you need not calculate what happens to the selection.

# How it is done

The idea is:

1. At the beginning of the changes the selection is put to the document as two nodes. One for the head and one for the anchor or just one if the selection is a simple cursor.
2. You implement the changes as one fragment representing how that part of the document should be after the changes. The selection nodes get moved arround by the changes like single characters do.
3. At the end of the changes the selection nodes get removed and the actual selection is set to their positions.

Since all this happens within just one transform the selection nodes never remain within the document. The selection nodes actually get added and removed again before the one replace step is done. They never appear in any transaction history or get persisted or shared to collaborators of the document.

# Example

Use this module when writing complicated transforms.

## Extend the schema by the marker node types

When setting up your schema you need to add the marker node types.

```javascript
import {addSelectionMarkersNodes} from "prosemirror-selection-markers"

const mySchema = new Schema({
  nodes: addSelectionMarkersNodes(baseSchema.spec.nodes, "inline"),
  marks: baseSchema.spec.marks
})
```

## Write your transforms

When writing your transforms use `addSelectionAsMarkers` and `replaceWithSelection`.

```javascript
import {Fragment} from "prosemirror-model"
import {Transform} from "prosemirror-transform"
import {addSelectionAsMarkers, replaceWithSelection} from "prosemirror-selection-markers"

function doComplicatedTransform(tr, doc, selection) {

	({doc, selection} = addSelectionAsMarkers(doc, selection));

	let from, to, fragment;

	// Expand the selection to the actual range that changes (from, to).
	// Set up a fragment for that range containing all the changes.
	// .. = doc.slice(.., ..).content ..
	// .. = Fragment.from(doc.type.schema.nodes.my_node.create(null, ..))

	tr = replaceWithSelection(tr, fragment, from, to);

	return tr;
}
```

# License

This code is released under an
[MIT license](https://github.com/thomasgafner/prosemirror-selection-markers/tree/master/LICENSE).
