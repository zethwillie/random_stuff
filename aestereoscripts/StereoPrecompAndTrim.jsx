function preCompGetUniqueItemName(name)
{
	var items = app.project.items;
	var doubleFound;
	var tmpName = name;
	var iteration = 2;
	do
	{
		doubleFound = false;
		for (var i = 1; i <= items.length; ++i)
		{
			if (items[i].name == tmpName)
			{
				tmpName = name;
				if (tmpName.length + iteration.toString().length + 1 > 31)
					tmpName = tmpName.slice(0, 31 - (iteration.toString().length + 1));	
				tmpName = tmpName + " " + iteration.toString();
				iteration++;
				doubleFound = true;
				break;
			}
		}
	} while (doubleFound);	
	return tmpName;
}

function preCompGetItemName(name)
{
	if (name.length > 31)
		name = name.slice(0, 30 - (name.length + 1));
	return preCompGetUniqueItemName(name);
}

var moveAllAttributes = confirm("Move all attributes?");

var selectedComp = app.project.activeItem;
if ((selectedComp != null) && (selectedComp instanceof CompItem))
{
	app.beginUndoGroup("PrecompAndTrim");
	var layers = selectedComp.selectedLayers;
	for (var i = 0; i < layers.length; ++i)
	{			
		var preCompLayerStartTime = layers[i].inPoint;
			
		var indices = new Array();
		indices[0] = 1;
		for (var j = 1; j <= selectedComp.layers.length; ++j)
			if (selectedComp.layers[j] == layers[i])
				indices[0] = j;
		var preComp = selectedComp.layers.precompose(indices, preCompGetItemName("Comp " + layers[i].name), moveAllAttributes);
		
		if (moveAllAttributes)
		{
			preComp.layers[1].startTime = preComp.layers[1].startTime - preComp.layers[1].inPoint;
			preComp.duration = preComp.layers[1].outPoint - preComp.layers[1].inPoint;
			
			selectedComp.layers[indices[0]].startTime = preCompLayerStartTime;
		}
		else
		{
			preComp.layers[1].startTime = -(selectedComp.layers[indices[0]].inPoint + selectedComp.layers[indices[0]].startTime);
			preComp.duration = selectedComp.layers[indices[0]].outPoint - selectedComp.layers[indices[0]].inPoint;
			
			selectedComp.layers[indices[0]].startTime = preCompLayerStartTime;
			selectedComp.layers[indices[0]].inPoint = 0;
			selectedComp.layers[indices[0]].outPoint = selectedComp.layers[indices[0]].inPoint + preComp.duration;
			selectedComp.layers[indices[0]].duration = preComp.duration;
		}

	}
	app.endUndoGroup();
}
