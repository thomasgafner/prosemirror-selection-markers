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
