import {Slice, Fragment} from "prosemirror-model"
import {Selection, TextSelection} from "prosemirror-state"

const headMarker = {
	inline: true,
	atom: true,
	selectable: false,
	parseDOM: [{tag: "head2dv4neshlsw"}],
	toDOM() { return ["head2dv4neshlsw"] }
}

const anchorMarker = {
	inline: true,
	atom: true,
	selectable: false,
	parseDOM: [{tag: "anchor6nhxkswgab"}],
	toDOM() { return ["anchor6nhxkswgab"] }
}

function add(obj, props) {
  let copy = {}
  for (let prop in obj) copy[prop] = obj[prop]
  for (let prop in props) copy[prop] = props[prop]
  return copy
}

// :: (OrderedMap<NodeSpec>, ?string) → OrderedMap<NodeSpec>
// Convenience function for adding selection marker node types to a map
// specifying the nodes for a schema. Adds `"head_marker"` and `"anchor_marker"`.
//
//  `markerGroup` can be given to assign a group name to the selection markers
//  node types. By default that is `"inline"`.
export function addSelectionMarkersNodes(nodes, markerGroup = 'inline') {
  return nodes.append({
    head_marker: add(headMarker, {group: markerGroup}),
    anchor_marker: add(anchorMarker, {group: markerGroup})
  })
}

// :: (Node, Selection) → {Node, Selection}
// Get a new document with the cursor or head and anchor added as two marker nodes
// along with the updated selection. Never forget to remove those markers later!
// Usage: ({doc, selection} = insertSelectionMarkers(doc, selection));
// Later you want to remove them with `removeMarkersGetSelectionOffsets`.
export function insertSelectionMarkers(doc, selection) {
	const {$cursor, $head, $anchor} = selection;
	const ntps = doc.type.schema.nodes;
	// selection objects absolutely must be reresolved when the document changes,
	// because they consist of ResolvedPos pointing to node sizes and offsets in the old doc.
	if ($cursor) {
		doc = doc.replace($cursor.pos, $cursor.pos,
			new Slice(Fragment.from(ntps.head_marker.create()), 0, 0));
		selection = new TextSelection(doc.resolve($cursor.pos));
	} else if ($anchor && $head) {
		if ($anchor.pos < $head.pos) {
			doc = doc.replace(selection.$head.pos, selection.$head.pos,
				new Slice(Fragment.from(ntps.head_marker.create()), 0, 0));
			doc = doc.replace(selection.$anchor.pos, selection.$anchor.pos,
				new Slice(Fragment.from(ntps.anchor_marker.create()), 0, 0));
			selection = new TextSelection($anchor, doc.resolve($head.pos+1));
		} else {
			doc = doc.replace(selection.$anchor.pos, selection.$anchor.pos,
				new Slice(Fragment.from(ntps.anchor_marker.create()), 0, 0));
			doc = doc.replace(selection.$head.pos, selection.$head.pos,
				new Slice(Fragment.from(ntps.head_marker.create()), 0, 0));
			selection = new TextSelection(doc.resolve($anchor.pos+1), $head);
		}
	}
	return {doc, selection}
}

// :: (Slice) → {slice: Slice, selOff: {head: ?int, anchor: ?int, cursor: ?int}}
// Get a new slice with the head and anchor markers removed along with the two
// positions, where they where (relative to the start of the slice).
// To add the markers use `insertSelectionMarkers`.
// Later you may want to create a selection with `createSelectionFromOffsets`.
function removeMarkersGetSelectionOffsets(slice) {
	let finalHeadPos = -1;
	let finalAnchorPos = -1;
	slice.content.descendants(function(node, pos, prnt) {
		// console.log('n', node.type.name)
		if (finalHeadPos == -1 && node.type.name == 'head_marker') {
			finalHeadPos = pos;
		}
		if (finalAnchorPos == -1 && node.type.name == 'anchor_marker') {
			finalAnchorPos = pos;
		}
		return finalHeadPos == -1 || finalAnchorPos == -1 // just a little optimization
	});
	// console.log('final pos', finalHeadPos, finalAnchorPos)
	// remove the markers and calc selection offsets
	// TODO fix if there is more than one anchor for a type
	if (finalHeadPos != -1 && finalAnchorPos != -1) {
		if (finalAnchorPos < finalHeadPos) {
			const slc = slice
				.removeBetween(finalHeadPos, finalHeadPos+1)
				.removeBetween(finalAnchorPos, finalAnchorPos+1);
			return {slice: slc, selOff: {anchor: finalAnchorPos, head: finalHeadPos-1}};
		} else {
			const slc = slice
				.removeBetween(finalAnchorPos, finalAnchorPos+1)
				.removeBetween(finalHeadPos, finalHeadPos+1);
			return {slice: slc, selOff: {anchor: finalAnchorPos-1, head: finalHeadPos}};
		}
	} else if (finalHeadPos != -1 || finalAnchorPos != -1) {
		if (finalHeadPos == -1) { // should not happen, but ..
			finalHeadPos = finalAnchorPos;
		}
		const slc = slice.removeBetween(finalHeadPos, finalHeadPos+1);
		return {slice: slc, selOff: {cursor: finalHeadPos}};
	}
	return {slice, selOff: {}};
}

// :: (Node, int, {}) → Selection
// Create a selection for a document where a slice is used at a given position.
// That slice along with the selection offsets are the result from
// using `removeMarkersGetSelectionOffsets` to remove selection markers.
function createSelectionFromOffsets(doc, sliceStartPos, selOff) {
	if (selOff.cursor) {
		const newPos = sliceStartPos + selOff.cursor;
		return Selection.findFrom(doc.resolve(newPos), 1, true); // 1 == foreward
	} else if (selOff.anchor && selOff.head) {
		return new TextSelection(
			doc.resolve(sliceStartPos + selOff.anchor),
			doc.resolve(sliceStartPos + selOff.head));
	}
}

// :: (Transaction, Fragment|Node|[Node], integer, integer) → Transaction
// Remove the markers and replace the original range with the new content.
// The selection on the transform is set to where the markers have been.
// This is the opposite of adding the markers by `insertSelectionMarkers`.
export function replaceWithAndSetSelection(tr, content, from, to) {
	to--; // There is always one marker in it.
	let slice = new Slice(Fragment.from(content), 0, 0);
	let selOff;
	({slice, selOff} = removeMarkersGetSelectionOffsets(slice));
	tr = tr.replaceWith(from, to, slice.content);
	const newSel = createSelectionFromOffsets(tr.doc, from, selOff);
	tr = tr.setSelection(newSel);
	return tr;
}

// :: (Transaction, Slice, integer, integer) → Transaction
// Remove the markers and replace the original range with the new slice.
// The selection on the transform is set to where the markers have been.
// This is the opposite of adding the markers by `insertSelectionMarkers`.
export function replaceAndSetSelection(tr, slice, from, to) {
	to--; // There is always one marker in it.
	let selOff;
	({slice, selOff} = removeMarkersGetSelectionOffsets(slice));
	tr = tr.replace(from, to, slice);
	const newSel = createSelectionFromOffsets(tr.doc, from, selOff);
	tr = tr.setSelection(newSel);
	return tr;
}
