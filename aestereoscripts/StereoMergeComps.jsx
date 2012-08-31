//var moveAllAttributes = confirm("Move all attributes?");

// Get the two selected items
var items = app.project.items;
var selectedItems = new Array();
var selectedItemIndices = new Array();
for (var i = 1; i <= items.length; ++i)
{
	var item = items[i];
	if (item.selected)
	{
		selectedItems[selectedItems.length] = item;
		selectedItemIndices[selectedItemIndices.length] = i;
	}
}

if (selectedItems.length != 2)
{
	alert("Please select the left and right composition.");
}
else
{
	if (!((selectedItems[0] instanceof CompItem) && (selectedItems[1] instanceof CompItem)))
	{
		alert("Please select two comp items.");
	}
	else
	{
		var mergeDirection = confirm("Merge right comp into left comp?")
		var reverseOrder = confirm("Reverse insert order?")

		app.beginUndoGroup("Stereo Merge Comps");

		var comp1, comp2;
		if (mergeDirection)
		{
			comp1 = selectedItems[0];
			comp2 = selectedItems[1];
		}
		else
		{
			comp1 = selectedItems[1];
			comp2 = selectedItems[0];
		}
	
		var selectedLayers = new Array();
		for (var i = 1; i <= comp1.layers.length; ++i)
		{
			if (comp1.layers[i].selected)
			{
				selectedLayers[selectedLayers.length] = comp1.layers[i];
				comp1.layers[i].selected = false;
			}
		}
		
		for (var i = 1; i <= comp1.layers.length; ++i)
		{
			if (i <= comp2.layers.length)
			{
				comp2.layers[i].copyToComp(comp1);
				comp1.layers[1].shy = true;
				comp1.layers[1].enabled = false;
				if (reverseOrder)
					comp1.layers[1].moveBefore(comp1.layers[i * 2]);
				else
					comp1.layers[1].moveAfter(comp1.layers[i * 2]);
			}
		}
		/*for (var i = comp1LayerLength + 1; i <= comp2LayerLength; ++i)
		{
				comp2.layers[i].copyToComp(comp1);
				comp1.layers[1].moveAfter(comp1.layers[comp1.layers.length]);
		}*/

		for (var i = 0; i < selectedLayers.length; ++i)
		{
			selectedLayers[i].selected = true;
		}

		app.endUndoGroup();
	}
}