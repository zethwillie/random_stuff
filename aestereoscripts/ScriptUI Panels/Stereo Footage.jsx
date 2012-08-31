var footageInfoText = "Stereo Footage v1.0\
\
---------------------------------------------------------------------\
Turns two selected footage items into a comp system that enables easy alignment of stereoscopic content.\
The script generates three comps: Two for individual alignment of the left and the right view, and one for global adjustments that affect both left and right comp.\
---------------------------------------------------------------------\
View the info document for a detailed explanation.\
---------------------------------------------------------------------\
Legal information: This script is for free and commercial use. It is, however, not authorized for redistribution or sale.\
The author can not be held liable for any damages this script MAY cause.\
\
© 2009, Chris Keller";

// User interface
function footageCreateUI(thisObj)
{
	var panel = (thisObj instanceof Panel) ? thisObj : new Window("palette", "Stereo Converter", undefined, {resizeable:true});
	
	var ui = 
	"group { \
		orientation:'column', alignment:['fill','top'], \
		pnlSettings: Panel { \
			alignment:['fill','top'] ,\
			chkAutomaticNaming: Checkbox { text:'Automatic Naming', value:true, alignment:['left','top'] }, \
			grp: Group { \
				margins:[0,0,0,0], alignment:['fill','top'], \
				txtName: EditText {text:'(auto)', characters:31, alignment:['left','center'] }, \
			}, \
		} \
		pnlSettings2: Panel { \
			text:'', alignment:['fill','top'], \
			chkKeepRes: Checkbox { text:'Keep Resolution', value:true, alignment:['fill','top'] }, \
			grp: Group { \
				margins:[0,0,0,0], alignment:['fill','top'], \
				txtWidth: EditText {text:'(auto)', characters:6, alignment:['left','center'] }, \
				lblTimes: StaticText {text:'x', alignment:['left','center'] }, \
				txtHeight: EditText {text:'(auto)', characters:6, alignment:['left','center'] }, \
			}, \
		}, \
		pnlSettings3: Panel { \
			text:'', alignment:['fill','top'], \
			chkCreateFolder: Checkbox { text:'Create Folder', value:true, alignment:['fill','top'] }, \
			chkAutoAdvance: Checkbox { text:'Auto Advance Items', value:false, alignment:['fill','top'] }, \
		}, \
		pnlSettings4: Panel { \
			text:'', alignment:['fill','top'], \
			chkWorkInExistingComp: Checkbox { text:'Work In Existing Comps', value:false, alignment:['fill','top'] }, \
		}, \
		pnlSettings5: Panel { \
			text:'', alignment:['fill','top'], \
			chkSwap: Checkbox { text:'Swap Left + Right', value:false, alignment:['fill','top'] }, \
		}, \
		pnlSettings6: Panel { \
			alignment:['fill','top'] ,\
			chkTemporalAlignment: Checkbox { text:'Temporal Alignment', alignment:['left','top'], value:true }, \
			chkGeometricalAlignment: Checkbox { text:'Geometrical Alignment', alignment:['left','top'], value:true }, \
			chkColorAlignment: Checkbox { text:'Color Alignment', alignment:['left','top'], value:true }, \
			chkFW: Checkbox { text:'Floating Window Adjustments', alignment:['left','top'], value:true }, \
		}, \
		pnlSettings7: Panel { \
			text:'', alignment:['fill','top'], \
			grp: Group { \
				alignment:['left','top'], \
				btnExportForAlignment : Button {text:'Export Frames For Alignment'}, \
				listOutputModules : DropDownList {maximumSize:[75,20]}, \
			} \
			grp2: Group { \
				alignment:['left','top'], \
				btnLoadAlignmentData: Button { text:'Load StereoPhoto Maker Alignment Data' }, \
				chkAddValues: Checkbox { text:'Add Values', value:false }, \
			} \
		}, \
		grp: Group { \
			alignment:['left','top'], \
			btnConvert: Button { text:'Convert To Stereo Footage', alignment:['left','top']  }, \
			btnInfo: Button { text:'?', maximumSize:[25,20]}, \
		}, \
	}";

	//app.project.renderQueue.showWindow(false);

	/*grp: Group { \
		alignment:['left','top'], \
		txtApplyTo: StaticText { text:'Apply To:', alignment:['left','top']}, \
		rdBoth: RadioButton { text:'Both', value:true, alignment:['left','top']}, \
		rdLeft: RadioButton { text:'Left', alignment:['left','top'] }, \
		rdRight: RadioButton { text:'Right', alignment:['left','top'] }, \
	} \*/

	panel.grp = panel.add(ui);

	var tmpComp = app.project.items.addComp("STEREO tmpComp", 512, 512, 1, 1, 25);
	var dummyItem = app.project.renderQueue.items.add(tmpComp);
	var outputModule = dummyItem.outputModule(1);

	for (var i = 0; i < outputModule.templates.length; ++i)
		if (outputModule.templates[i].indexOf("_HIDDEN") != 0)
			panel.grp.pnlSettings7.grp.listOutputModules.add("item", outputModule.templates[i]);
	for (var i = 0; i < outputModule.templates.length; ++i)
	{
		panel.grp.pnlSettings7.grp.listOutputModules.selection = i;
		if (outputModule.templates[i].toUpperCase().indexOf("PNG") != -1)
			break;
	}

	dummyItem.remove();
	tmpComp.remove();
	app.project.renderQueue.showWindow(false);
	if (app.project.numItems == 0)
		app.project.close(CloseOptions.DO_NOT_SAVE_CHANGES);
	
	panel.grp.pnlSettings.grp.txtName.enabled = false;

	panel.grp.pnlSettings2.grp.txtWidth.enabled = false;
	panel.grp.pnlSettings2.grp.txtHeight.enabled = false;

	var winGfx = panel.graphics;
	var darkColorBrush = winGfx.newPen(winGfx.BrushType.SOLID_COLOR, [0,0,0], 1);
	panel.grp.pnlSettings.grp.txtName.graphics.foregroundColor = darkColorBrush;	
	panel.grp.pnlSettings2.grp.txtWidth.graphics.foregroundColor = darkColorBrush;
	panel.grp.pnlSettings2.grp.txtHeight.graphics.foregroundColor = darkColorBrush;
	panel.grp.pnlSettings7.grp.listOutputModules.graphics.foregroundColor = darkColorBrush;

	panel.layout.layout(true);
	panel.grp.minimumSize = panel.grp.size;
	panel.layout.resize();
	panel.onResizing = panel.onResize = function () {this.layout.resize();}

	panel.grp.pnlSettings7.grp2.btnLoadAlignmentData.onClick = footageOnButtonClick2;
	panel.grp.pnlSettings7.grp.btnExportForAlignment.onClick = footageOnButtonClick3;
	panel.grp.grp.btnConvert.onClick = footageOnButtonClick;
	panel.grp.grp.btnInfo.onClick = footageOnInfoClick;
	panel.grp.pnlSettings.chkAutomaticNaming.onClick = footageOnCheckBoxClick;
	panel.grp.pnlSettings2.chkKeepRes.onClick = footageOnCheckBoxClick2;
	
	return panel;
}

// -----------------------------------------------------------------------------------------------------------------------------

function footageOnInfoClick()
{
	alert(footageInfoText);
}

// -----------------------------------------------------------------------------------------------------------------------------

function footageOnCheckBoxClick()
{
	if (footagePanel.grp.pnlSettings.chkAutomaticNaming.value)
	{
		footagePanel.grp.pnlSettings.grp.txtName.enabled = false;
		footagePanel.grp.pnlSettings.grp.txtName.text = "(automatic)";
	}
	else
	{
		footagePanel.grp.pnlSettings.grp.txtName.enabled = true;
		footagePanel.grp.pnlSettings.grp.txtName.text = footageGetItemName("STEREO FOOTAGE");
	}	
}

// -----------------------------------------------------------------------------------------------------------------------------

function footageOnCheckBoxClick2()
{	
	var items = app.project.items;
	var item = null;
	for (var i = 1; i <= items.length; ++i)
	{
		if (items[i].selected)
		{
			item = items[i];
			break;
		}
	}	
	
	if (footagePanel.grp.pnlSettings2.chkKeepRes.value)
	{
		footagePanel.grp.pnlSettings2.grp.txtWidth.enabled = false;
		footagePanel.grp.pnlSettings2.grp.txtWidth.text = "(auto)";
		footagePanel.grp.pnlSettings2.grp.txtHeight.enabled = false;
		footagePanel.grp.pnlSettings2.grp.txtHeight.text = "(auto)";
	}
	else
	{
		footagePanel.grp.pnlSettings2.grp.txtWidth.enabled = true;
		footagePanel.grp.pnlSettings2.grp.txtWidth.text = item != null ? item.width.toString() : "1920";
		footagePanel.grp.pnlSettings2.grp.txtHeight.enabled = true;
		footagePanel.grp.pnlSettings2.grp.txtHeight.text = item != null ? item.height.toString() : "1080";
	}
}

// -----------------------------------------------------------------------------------------------------------------------------

function footageGetUniqueItemName(name)
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

// -----------------------------------------------------------------------------------------------------------------------------

function footageGetItemName(name)
{
	if (name.length > 31)
		name = name.slice(0, 30 - (name.length + 1));
	return footageGetUniqueItemName(name);
}

// -----------------------------------------------------------------------------------------------------------------------------

function footageGetItemNameEx(name, leftArg, rightArg)
{
	var leftLength = Math.ceil((31 - name.length - 2) * 0.5);
	if (leftArg.length > leftLength)
		leftArg = leftArg.slice(0, leftLength);
	var rightLength = Math.floor((31 - name.length - 2) * 0.5);
	if (rightArg.length > rightLength)
		rightArg = rightArg.slice(0, rightLength);
	return footageGetUniqueItemName(name + " " + leftArg + "+" + rightArg);
}

// -----------------------------------------------------------------------------------------------------------------------------

function footageFixLayer(layer)
{
	layer.anchorPoint.expression = "[thisComp.width / 2, thisComp.height / 2]";
	layer.position.expression = "[thisComp.width / 2, thisComp.height / 2]";
	layer.scale.expression = "[100, 100]";
	layer.rotation.expression = "0";
	layer.opacity.expression = "100";
}

// -----------------------------------------------------------------------------------------------------------------------------

// Adds the current frame of the two selected comps to the render queue
function footageOnButtonClick3()
{
	try
	{
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
		
		if (selectedItems.length != 2 || !(selectedItems[0] instanceof CompItem) || !(selectedItems[1] instanceof CompItem))
		{
			alert("Please select the left and right footage comps.");
			return;
		}
	
		var leftComp, rightComp;
		try
		{
				if (footagePanel.grp.pnlSettings5.chkSwap.value)
				{			
					leftComp = selectedItems[1];
					rightComp = selectedItems[0];
				}
				else
				{			
					leftComp = selectedItems[0];
					rightComp = selectedItems[1];
				}
		}
		catch (e) { alert ("Could not access panel. Please restart the script."); app.endUndoGroup(); return;}	

		var rqItems = new Array();
		rqItems[0] = app.project.renderQueue.items.add(leftComp); 
		var folder = Folder.selectDialog("Output To Folder", rqItems[0].outputModules[1].file.path);
		if (folder != null)
		{

			rqItems[rqItems.length - 1].timeSpanStart = leftComp.time;
			rqItems[rqItems.length - 1].timeSpanDuration = leftComp.frameDuration;
			rqItems[rqItems.length - 1].outputModules[1].applyTemplate(footagePanel.grp.pnlSettings7.grp.listOutputModules.selection);
			rqItems[rqItems.length - 1].outputModules[1].file = new File(folder.fsName + "/" + leftComp.name.replace(".","_") + "_[#]");// + rqItems[rqItems.length - 1].outputModules[1].file.displayName);

			rqItems[rqItems.length] = app.project.renderQueue.items.add(rightComp); 
			rqItems[rqItems.length - 1].timeSpanStart = leftComp.time;
			rqItems[rqItems.length - 1].timeSpanDuration = rightComp.frameDuration;
			rqItems[rqItems.length - 1].outputModules[1].applyTemplate(footagePanel.grp.pnlSettings7.grp.listOutputModules.selection);
			rqItems[rqItems.length - 1].outputModules[1].file = new File(folder.fsName + "/" + rightComp.name.replace(".","_") +"_[#]");// + rqItems[rqItems.length - 1].outputModules[1].file.displayName);

			var itemsQueued = new Array();
			for (var i = 1; i <= app.project.renderQueue.items.length - 2; ++i)
			{
				itemsQueued[i] = app.project.renderQueue.items[i].render;
				try
				{
					if (app.project.renderQueue.items[i].status != RQItemStatus.RENDERING && app.project.renderQueue.items[i].status != RQItemStatus.USER_STOPPED && app.project.renderQueue.items[i].status != RQItemStatus.ERR_STOPPED && app.project.renderQueue.items[i].status != RQItemStatus.DONE)
						app.project.renderQueue.items[i].render = false;
				}
				catch (e) { }
			}	

			app.project.renderQueue.render();

			for (var i = 1; i <= app.project.renderQueue.items.length - 2; ++i)
			{
				try
				{
					if (app.project.renderQueue.items[i].status != RQItemStatus.RENDERING && app.project.renderQueue.items[i].status != RQItemStatus.USER_STOPPED && app.project.renderQueue.items[i].status != RQItemStatus.ERR_STOPPED && app.project.renderQueue.items[i].status != RQItemStatus.DONE)
						app.project.renderQueue.items[i].render = itemsQueued[i];
				}
				catch (e) { }
			}
		
			for (var i = 0; i < rqItems.length; ++i)
			{
				rqItems[i].remove();
			}		
		}
		else 
			rqItems[0].remove();

		try
		{
			if (folder != null)
				folder.execute();
		}
		catch (e) { }
		//app.project.renderQueue.showWindow(false);
	}
	catch (e)
	{
		alert("Error - Script aborted\n\n" + "Error name: " + e.name + "\nError message: " + e.message);
	}	
}

// -----------------------------------------------------------------------------------------------------------------------------

// Loads an alignment file and apllies the data to the selected footage comps
function footageOnButtonClick2()
{
	//try
	{
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
		
		if (selectedItems.length != 2 || !(selectedItems[0] instanceof CompItem) || !(selectedItems[1] instanceof CompItem))
		{
			alert("Please select the left and right footage comps.");
			return;
		}

		var file = File.openDialog("Select an alignment file", "Alignment Files:*.alv");
		if (file == null)
			return;

		app.beginUndoGroup("Load Alignment Data");

		var rotationL = 0;
		var rotationR = 0;
		var sizeL = 100;
		var sizeR = 100;
		var positionH = 0;
		var positionV = 0;
		var perspectiveVL = 0;
		var perspectiveVR = 0;
		var perspectiveHL = 0;
		var perspectiveHR = 0;	
		var reversePerspective = false;
		
		// Parse file		
		file.open("r");
		while (!file.eof)
		{
			var line =file.readln();
			var searchString = "Rotation_L=";
			if (line.indexOf(searchString) == 0)
			{
				rotationL = parseFloat(line.slice(searchString.length, line.length));
				if (isNaN(rotationL))
				{
					alert("Error while parsing file.");
					app.endUndoGroup();
					file.close();
					return;
				}
				else
				{
					rotationL *= 0.1;
				}
			}
			searchString = "Rotation_R=";
			if (line.indexOf(searchString) == 0)
			{
				rotationR = parseFloat(line.slice(searchString.length, line.length));
				if (isNaN(rotationR))
				{
					alert("Error while parsing file.");
					app.endUndoGroup();
					file.close();
					return;
				}
				else
				{
					rotationR *= 0.1;
				}
			}
			searchString = "Size1000_L=";
			if (line.indexOf(searchString) == 0)
			{
				sizeL = parseFloat(line.slice(searchString.length, line.length));
				if (isNaN(sizeL))
				{
					alert("Error while parsing file.");
					app.endUndoGroup();
					file.close();
					return;
				}
				else
				{
					sizeL = 100 + 0.1 * sizeL;
				}
			}
			searchString = "Size1000_R=";
			if (line.indexOf(searchString) == 0)
			{
				sizeR = parseFloat(line.slice(searchString.length, line.length));
				if (isNaN(sizeR))
				{
					alert("Error while parsing file.");
					app.endUndoGroup();
					file.close();
					return;
				}
				else
				{
					sizeR = 100 + 0.1 * sizeR;
				}			
			}
			searchString = "Position_H=";
			if (line.indexOf(searchString) == 0)
			{
				positionH = parseFloat(line.slice(searchString.length, line.length));
				if (isNaN(positionH))
				{
					alert("Error while parsing file.");
					app.endUndoGroup();
					file.close();
					return;
				}
			}
			searchString = "N_Position_V=";
			if (line.indexOf(searchString) == 0)
			{
				positionV = parseFloat(line.slice(searchString.length, line.length));
				if (isNaN(positionV))
				{
					alert("Error while parsing file.");
					app.endUndoGroup();
					file.close();
					return;
				}
			}
			searchString = "PerspectiveV_L=";
			if (line.indexOf(searchString) == 0)
			{
				perspectiveVL = parseFloat(line.slice(searchString.length, line.length));
				if (isNaN(perspectiveVL))
				{
					alert("Error while parsing file.");
					app.endUndoGroup();
					file.close();
					return;
				}
				else
				{
					perspectiveVL *= 0.1;
				}
			}
			searchString = "PerspectiveV_R=";
			if (line.indexOf(searchString) == 0)
			{
				perspectiveVR = parseFloat(line.slice(searchString.length, line.length));
				if (isNaN(perspectiveVR))
				{
					alert("Error while parsing file.");
					app.endUndoGroup();
					file.close();
					return;
				}
				else
				{
					perspectiveVR *= 0.1;
				}			
			}
			searchString = "PerspectiveH_L=";
			if (line.indexOf(searchString) == 0)
			{
				perspectiveHL = parseFloat(line.slice(searchString.length, line.length));
				if (isNaN(perspectiveHL))
				{
					alert("Error while parsing file.");
					app.endUndoGroup();
					file.close();
					return;
				}
				else
				{
					perspectiveHL *= 0.1;
				}			
			}
			searchString = "PerspectiveH_R=";
			if (line.indexOf(searchString) == 0)
			{
				perspectiveHR = parseFloat(line.slice(searchString.length, line.length));
				if (isNaN(perspectiveHR))
				{
					alert("Error while parsing file.");
					app.endUndoGroup();
					file.close();
					return;
				}
				else
				{
					perspectiveHR *= 0.1;
				}			
			}
			searchString = "ReversePerspective=";
			if (line.indexOf(searchString) == 0)
			{
				reversePerspective = parseInt(line.slice(searchString.length, line.length));
				if (isNaN(reversePerspective))
				{
					alert("Error while parsing file.");
					app.endUndoGroup();
					file.close();
					return;
				}
				reversePerspective = reversePerspective != 0;
			}		
		}

		var leftComp, rightComp;
		try
		{
				if (footagePanel.grp.pnlSettings5.chkSwap.value)
				{			
					leftComp = selectedItems[1];
					rightComp = selectedItems[0];
				}
				else
				{			
					leftComp = selectedItems[0];
					rightComp = selectedItems[1];
				}
		}
		catch (e) { alert ("Could not access panel. Please restart the script."); app.endUndoGroup(); return;}

		var leftLayer = leftComp.layers.byName("Geometrical Adjustments");
		var rightLayer = rightComp.layers.byName("Geometrical Adjustments");
	
		// Set position values

		if (positionH > 0)
		{
			if (rightLayer.Effects(1).property(1).isTimeVarying && (rightLayer.Effects(1).property(1).numKeys >= 1 || rightLayer.Effects(1).property(1).expression == "" || !rightLayer.Effects(1).property(1).expressionEnabled))
			{
				rightLayer.Effects(1).property(1).setValueAtTime(leftComp.time, (footagePanel.grp.pnlSettings7.grp2.chkAddValues.value ? rightLayer.Effects(1).property(1).valueAtTime(leftComp.time, true) : 0) + positionH);
			}
			else
				rightLayer.Effects(1).property(1).setValue((footagePanel.grp.pnlSettings7.grp2.chkAddValues.value ? rightLayer.Effects(1).property(1).value : 0) + positionH);
				
			if (leftLayer.Effects(1).property(1).isTimeVarying && (leftLayer.Effects(1).property(1).numKeys >= 1 || leftLayer.Effects(1).property(1).expression == "" || !leftLayer.Effects(1).property(1).expressionEnabled))
			{
				leftLayer.Effects(1).property(1).setValueAtTime(leftComp.time, leftLayer.Effects(1).property(1).valueAtTime(leftComp.time, true));
			}
		}
		else
		{
			if (leftLayer.Effects(1).property(1).isTimeVarying && (leftLayer.Effects(1).property(1).numKeys >= 1 || leftLayer.Effects(1).property(1).expression == "" || !leftLayer.Effects(1).property(1).expressionEnabled))
			{
				leftLayer.Effects(1).property(1).setValueAtTime(leftComp.time, (footagePanel.grp.pnlSettings7.grp2.chkAddValues.value ? leftLayer.Effects(1).property(1).valueAtTime(leftComp.time, true) : 0) - positionH);
			}
			else
				leftLayer.Effects(1).property(1).setValue((footagePanel.grp.pnlSettings7.grp2.chkAddValues.value ? leftLayer.Effects(1).property(1).value : 0) - positionH);
				
			if (rightLayer.Effects(1).property(1).isTimeVarying && (rightLayer.Effects(1).property(1).numKeys >= 1 || rightLayer.Effects(1).property(1).expression == "" || !rightLayer.Effects(1).property(1).expressionEnabled))
			{
				rightLayer.Effects(1).property(1).setValueAtTime(leftComp.time, rightLayer.Effects(1).property(1).valueAtTime(leftComp.time, true));
			}				
		}
	
		if (positionV > 0)
		{
			if (rightLayer.Effects(2).property(1).isTimeVarying  && (rightLayer.Effects(2).property(1).numKeys >= 1 || rightLayer.Effects(2).property(1).expression == "" || !rightLayer.Effects(2).property(1).expressionEnabled))
			{
				rightLayer.Effects(2).property(1).setValueAtTime(leftComp.time, (footagePanel.grp.pnlSettings7.grp2.chkAddValues.value ? rightLayer.Effects(2).property(1).valueAtTime(leftComp.time, true) : 0) + positionV);
			}
			else
				rightLayer.Effects(2).property(1).setValue((footagePanel.grp.pnlSettings7.grp2.chkAddValues.value ? rightLayer.Effects(2).property(1).value : 0) + positionV);
				
			if (leftLayer.Effects(2).property(1).isTimeVarying  && (leftLayer.Effects(2).property(1).numKeys >= 1 || leftLayer.Effects(2).property(1).expression == "" || !leftLayer.Effects(2).property(1).expressionEnabled))
			{
				leftLayer.Effects(2).property(1).setValueAtTime(leftComp.time, leftLayer.Effects(1).property(1).valueAtTime(leftComp.time, true));
			}				
		}
		else
		{
			if (leftLayer.Effects(2).property(1).isTimeVarying  && (leftLayer.Effects(2).property(1).numKeys >= 1 || leftLayer.Effects(2).property(1).expression == "" || !leftLayer.Effects(2).property(1).expressionEnabled))
			{
				leftLayer.Effects(2).property(1).setValueAtTime(leftComp.time, (footagePanel.grp.pnlSettings7.grp2.chkAddValues.value ? leftLayer.Effects(1).property(1).valueAtTime(leftComp.time, true) : 0) - positionV);
			}
			else
				leftLayer.Effects(2).property(1).setValue((footagePanel.grp.pnlSettings7.grp2.chkAddValues.value ? leftLayer.Effects(2).property(1).value : 0) - positionV);
			
			if (rightLayer.Effects(2).property(1).isTimeVarying  && (rightLayer.Effects(2).property(1).numKeys >= 1 || rightLayer.Effects(2).property(1).expression == "" || !rightLayer.Effects(2).property(1).expressionEnabled))
			{
				rightLayer.Effects(2).property(1).setValueAtTime(leftComp.time, rightLayer.Effects(2).property(1).valueAtTime(leftComp.time, true));
			}				
		}		

		// Reset anchor points

		if (leftLayer.Effects(3).property(1).isTimeVarying  && (leftLayer.Effects(3).property(1).numKeys >= 1 || leftLayer.Effects(3).property(1).expression == "" || !leftLayer.Effects(3).property(1).expressionEnabled))
		{
			leftLayer.Effects(3).property(1).setValueAtTime(leftComp.time, 0);
		}
		else
			leftLayer.Effects(3).property(1).setValue(0);
			
		if (rightLayer.Effects(3).property(1).isTimeVarying  && (rightLayer.Effects(3).property(1).numKeys >= 1 || rightLayer.Effects(3).property(1).expression == "" || !rightLayer.Effects(3).property(1).expressionEnabled))
		{
			rightLayer.Effects(3).property(1).setValueAtTime(leftComp.time, 0);
		}
		else
			rightLayer.Effects(3).property(1).setValue(0);
			
		if (leftLayer.Effects(4).property(1).isTimeVarying  && (leftLayer.Effects(4).property(1).numKeys >= 1 || leftLayer.Effects(4).property(1).expression == "" || !leftLayer.Effects(4).property(1).expressionEnabled))
		{
			leftLayer.Effects(4).property(1).setValueAtTime(leftComp.time, 0);
		}
		else
			leftLayer.Effects(4).property(1).setValue(0);
			
		if (rightLayer.Effects(4).property(1).isTimeVarying  && (rightLayer.Effects(4).property(1).numKeys >= 1 || rightLayer.Effects(4).property(1).expression == "" || !rightLayer.Effects(4).property(1).expressionEnabled))
		{
			rightLayer.Effects(4).property(1).setValueAtTime(leftComp.time, 0);
		}
		else
			rightLayer.Effects(4).property(1).setValue(0);			

		// Set the remaining geometrical values

		if (leftLayer.Effects(5).property(1).isTimeVarying  && (leftLayer.Effects(5).property(1).numKeys >= 1 || leftLayer.Effects(5).property(1).expression == "" || !leftLayer.Effects(5).property(1).expressionEnabled))
		{
			leftLayer.Effects(5).property(1).setValueAtTime(leftComp.time, (footagePanel.grp.pnlSettings7.grp2.chkAddValues.value ? leftLayer.Effects(5).property(1).valueAtTime(leftComp.time, true) * 0.01 : 1) * sizeL);
		}
		else
			leftLayer.Effects(5).property(1).setValue((footagePanel.grp.pnlSettings7.grp2.chkAddValues.value ? leftLayer.Effects(5).property(1).value * 0.01 : 1) * sizeL);
			
		if (rightLayer.Effects(5).property(1).isTimeVarying && (rightLayer.Effects(5).property(1).numKeys >= 1 || rightLayer.Effects(5).property(1).expression == "" || !rightLayer.Effects(5).property(1).expressionEnabled))
		{
			rightLayer.Effects(5).property(1).setValueAtTime(leftComp.time, (footagePanel.grp.pnlSettings7.grp2.chkAddValues.value ? rightLayer.Effects(5).property(1).valueAtTime(leftComp.time, true) * 0.01 : 1) * sizeR);
		}
		else
			rightLayer.Effects(5).property(1).setValue((footagePanel.grp.pnlSettings7.grp2.chkAddValues.value ? rightLayer.Effects(5).property(1).value * 0.01 : 1) * sizeR);

		if (leftLayer.Effects(6).property(1).isTimeVarying  && (leftLayer.Effects(6).property(1).numKeys >= 1 || leftLayer.Effects(6).property(1).expression == "" || !leftLayer.Effects(6).property(1).expressionEnabled))
		{
			leftLayer.Effects(6).property(1).setValueAtTime(leftComp.time, (footagePanel.grp.pnlSettings7.grp2.chkAddValues.value ? leftLayer.Effects(6).property(1).valueAtTime(leftComp.time, true) : 0) + rotationL);
		}
		else
			leftLayer.Effects(6).property(1).setValue((footagePanel.grp.pnlSettings7.grp2.chkAddValues.value ? leftLayer.Effects(6).property(1).value : 0) + rotationL);
			
		if (rightLayer.Effects(6).property(1).isTimeVarying  && (rightLayer.Effects(6).property(1).numKeys >= 1 || rightLayer.Effects(6).property(1).expression == "" || !rightLayer.Effects(6).property(1).expressionEnabled))
		{
			rightLayer.Effects(6).property(1).setValueAtTime(leftComp.time, (footagePanel.grp.pnlSettings7.grp2.chkAddValues.value ? rightLayer.Effects(6).property(1).valueAtTime(leftComp.time, true) : 0) + rotationR);
		}
		else
			rightLayer.Effects(7).property(1).setValue((footagePanel.grp.pnlSettings7.grp2.chkAddValues.value ? rightLayer.Effects(6).property(1).value : 0) + rotationR);

		if (leftLayer.Effects(7).property(1).isTimeVarying  && (leftLayer.Effects(7).property(1).numKeys >= 1 || leftLayer.Effects(7).property(1).expression == "" || !leftLayer.Effects(7).property(1).expressionEnabled))
		{
			leftLayer.Effects(7).property(1).setValueAtTime(leftComp.time, (footagePanel.grp.pnlSettings7.grp2.chkAddValues.value ? leftLayer.Effects(7).property(1).valueAtTime(leftComp.time, true) : 0) + (reversePerspective ? -1 : 1) * perspectiveHL);
		}
		else
			leftLayer.Effects(7).property(1).setValue((footagePanel.grp.pnlSettings7.grp2.chkAddValues.value ? leftLayer.Effects(7).property(1).value : 0) + (reversePerspective ? -1 : 1) * perspectiveHL);
			
		if (rightLayer.Effects(7).property(1).isTimeVarying  && (rightLayer.Effects(7).property(1).numKeys >= 1 || rightLayer.Effects(7).property(1).expression == "" || !rightLayer.Effects(7).property(1).expressionEnabled))
		{
			rightLayer.Effects(7).property(1).setValueAtTime(leftComp.time, (footagePanel.grp.pnlSettings7.grp2.chkAddValues.value ? rightLayer.Effects(7).property(1).valueAtTime(leftComp.time, true) : 0) + (reversePerspective ? -1 : 1) * perspectiveHR);
		}
		else
			rightLayer.Effects(7).property(1).setValue((footagePanel.grp.pnlSettings7.grp2.chkAddValues.value ? rightLayer.Effects(7).property(1).value : 0) + (reversePerspective ? -1 : 1) * perspectiveHR);

		if (leftLayer.Effects(8).property(1).isTimeVarying  && (leftLayer.Effects(8).property(1).numKeys >= 1 || leftLayer.Effects(8).property(1).expression == "" || !leftLayer.Effects(8).property(1).expressionEnabled))
		{
			leftLayer.Effects(8).property(1).setValueAtTime(leftComp.time, (footagePanel.grp.pnlSettings7.grp2.chkAddValues.value ? leftLayer.Effects(8).property(1).valueAtTime(leftComp.time, true) : 0) + (reversePerspective ? -1 : 1) * perspectiveVL);
		}
		else
			leftLayer.Effects(8).property(1).setValue((footagePanel.grp.pnlSettings7.grp2.chkAddValues.value ? leftLayer.Effects(8).property(1).value : 0) + (reversePerspective ? -1 : 1) * perspectiveVL);
			
		if (rightLayer.Effects(8).property(1).isTimeVarying  && (rightLayer.Effects(8).property(1).numKeys >= 1 || rightLayer.Effects(8).property(1).expression == "" || !rightLayer.Effects(8).property(1).expressionEnabled))
		{
			rightLayer.Effects(8).property(1).setValueAtTime(leftComp.time, (footagePanel.grp.pnlSettings7.grp2.chkAddValues.value ? rightLayer.Effects(8).property(1).valueAtTime(leftComp.time, true) : 0) + (reversePerspective ? -1 : 1) * perspectiveVR);
		}
		else
			rightLayer.Effects(8).property(1).setValue((footagePanel.grp.pnlSettings7.grp2.chkAddValues.value ? rightLayer.Effects(8).property(1).value : 0) + (reversePerspective ? -1 : 1) * perspectiveVR);
	}
	//catch (e)
	{
		//alert("Error - Script aborted\n\n" + "Error name: " + e.name + "\nError message: " + e.message);
	}	
	//finally
	{
		try
		{
			app.endUndoGroup();
			if (file != null)
				file.close();	
		}
		catch (e) {}
	}
}

// -----------------------------------------------------------------------------------------------------------------------------

// Main function
function footageOnButtonClick()
{	
	try
	{
		// Get the two selected items
		var items = app.project.items;
		var selectedItems = new Array();
		for (var i = 1; i <= items.length; ++i)
		{
			var item = items[i];
			if (item.selected)
			{
				selectedItems[selectedItems.length] = item;
			}
		}
		
		if (selectedItems.length != 2)
		{
			alert("Please select the left and right footage items.");
			return;
		}

		app.beginUndoGroup("Stereo Footage");

		var folder;
		var leftComp, rightComp;
		
		try
		{
			if (footagePanel.grp.pnlSettings4.chkWorkInExistingComp.value)
			{
				if (!(selectedItems[0] instanceof CompItem) || !(selectedItems[1] instanceof CompItem))
				{
					alert("Please select two comp items or disable \"Work In Existing Comps\".");
					app.endUndoGroup();
					return;
				}
				folder = footagePanel.grp.pnlSettings3.chkCreateFolder.value ? selectedItems[0].parentFolder.items.addFolder(footagePanel.grp.pnlSettings.chkAutomaticNaming.value ? footageGetItemNameEx("STEREO FOOTAGE",selectedItems[0].name,selectedItems[1].name): footageGetItemName("STEREO FOOTAGE " + footagePanel.grp.pnlSettings.grp.txtName.text)) : selectedItems[0].parentFolder;
				if (footagePanel.grp.pnlSettings5.chkSwap.value)
				{			
					leftComp = selectedItems[1];
					rightComp = selectedItems[0];
				}
				else
				{			
					leftComp = selectedItems[0];
					rightComp = selectedItems[1];
				}
			}
			else
			{
				folder = footagePanel.grp.pnlSettings3.chkCreateFolder.value ? selectedItems[0].parentFolder.items.addFolder(footagePanel.grp.pnlSettings.chkAutomaticNaming.value ? footageGetItemNameEx("STEREO FOOTAGE",selectedItems[0].name,selectedItems[1].name): footageGetItemName("STEREO FOOTAGE " + footagePanel.grp.pnlSettings.grp.txtName.text)) : selectedItems[0].parentFolder;
				
				// Determinate width and height
				var width = 0;
				var height = 0;

				var keepRes = footagePanel.grp.pnlSettings2.chkKeepRes.value;
				var widthText = footagePanel.grp.pnlSettings2.grp.txtWidth.text;
				var heightText = footagePanel.grp.pnlSettings2.grp.txtHeight.text;
				if (keepRes)
					width = selectedItems[0].width;
				else
				{
					if (!isNaN(parseInt(widthText)))
						width = parseInt(widthText);
					else
					{
						alert("Can not read width. Please enter a proper number.");
						app.endUndoGroup();
						return;
					}
				}
				if (keepRes)
					height = selectedItems[0].height;
				else
				{
					if (!isNaN(parseInt(heightText)))
						height = parseInt(heightText);
					else
					{
						alert("Can not read height. Please enter a proper number.");
						app.endUndoGroup();
						return;
					}
				}

				// Create footage comps
				var duration, frameRate;
				if (selectedItems[0] instanceof FootageItem && selectedItems[0].mainSource.isStill)
				{
					duration = 1;
					frameRate = 1;
				}
				else
				{
					duration = selectedItems[0].duration;
					frameRate = selectedItems[0].frameRate;
				}
				leftComp = folder.items.addComp(footagePanel.grp.pnlSettings.chkAutomaticNaming.value ? footageGetItemName("STEREO FOOTAGE L " + selectedItems[0].name): footageGetItemName("STEREO FOOTAGE L " + footagePanel.grp.pnlSettings.grp.txtName.text), width, height, selectedItems[0].pixelAspect, duration, frameRate);
				if (footagePanel.grp.pnlSettings5.chkSwap.value)				
					leftComp.layers.add(selectedItems[1]);
				else
					leftComp.layers.add(selectedItems[0]);

				if (selectedItems[1] instanceof FootageItem && selectedItems[1].mainSource.isStill)
				{
					duration = 1;
					frameRate = 1;
				}
				else
				{
					duration = selectedItems[1].duration;
					frameRate = selectedItems[1].frameRate;
				}	
				rightComp = folder.items.addComp(footagePanel.grp.pnlSettings.chkAutomaticNaming.value ? footageGetItemName("STEREO FOOTAGE R " + selectedItems[1].name): footageGetItemName("STEREO FOOTAGE R " + footagePanel.grp.pnlSettings.grp.txtName.text), width, height, selectedItems[1].pixelAspect, duration, frameRate);
				if (footagePanel.grp.pnlSettings5.chkSwap.value)				
					rightComp.layers.add(selectedItems[0]);
				else
					rightComp.layers.add(selectedItems[1]);
			}
		}
		catch (e) { alert ("Could not access panel. Please restart the script."); app.endUndoGroup(); return;}

		for (var i = 1; i <= leftComp.layers.length; ++i)
			leftComp.layers[i].selected = true;
		for (var i = 1; i <= rightComp.layers.length; ++i)
			rightComp.layers[i].selected = true;

		// Create global adjustment comp
		var white = new Array();
		white[0] = 1;
		white[1] = 1;
		white[2] = 1;
		var globalAdjustmentsLayer = leftComp.layers.addSolid(white, footageGetItemNameEx("Corrections",selectedItems[0].name,selectedItems[1].name), leftComp.width, leftComp.height, leftComp.pixelAspect);
		globalAdjustmentsLayer.name = "Corrections";
		globalAdjustmentsLayer.adjustmentLayer = true;
		footageFixLayer(globalAdjustmentsLayer);
		
		var optics = globalAdjustmentsLayer.Effects.addProperty("ADBE Optics Compensation");
		optics.name = "Lens Corrections";
		optics.property(2).setValue(true);
		optics.enabled = false;

		var slider1 = globalAdjustmentsLayer.Effects.addProperty("ADBE Slider Control");
		slider1.name = "Convergence";
		var slider2 = globalAdjustmentsLayer.Effects.addProperty("ADBE Slider Control");
		slider2.name = "Scale";
		slider2.property(1).setValue(100);
		var slider3 = globalAdjustmentsLayer.Effects.addProperty("ADBE Slider Control");
		slider3.name = "Position (Horizontal)";
		var slider4 = globalAdjustmentsLayer.Effects.addProperty("ADBE Slider Control");
		slider4.name = "Position (Vertical)";
		var slider5 = globalAdjustmentsLayer.Effects.addProperty("ADBE Slider Control");
		slider5.name = "Rotation";

		var indices = new Array();
		indices[0] = 1;
		globalAdjustmentsCompName = footagePanel.grp.pnlSettings.chkAutomaticNaming.value ? footageGetItemNameEx("Global Adjustments",selectedItems[0].name,selectedItems[1].name): footageGetItemName("Global Adjustments " + footagePanel.grp.pnlSettings.grp.txtName.text);
		var globalAdjustmentsComp = leftComp.layers.precompose(indices, globalAdjustmentsCompName, true);
		leftComp.layers[1].collapseTransformation = true;
		leftComp.layers[1].name = "Global Adjustments";
		
		// Create local adjustment layers, along with all desired effects
		
		if (footagePanel.grp.pnlSettings6.chkTemporalAlignment.value)
		{
			var temporalAdjustmentLayer = leftComp.layers.addNull();
			temporalAdjustmentLayer.name = "Temporal Adjustments";
			temporalAdjustmentLayer.enabled = false;

			footageFixLayer(temporalAdjustmentLayer);

			var slider1 = temporalAdjustmentLayer.Effects.addProperty("ADBE Slider Control");
			slider1.name = "Time Offset (Frames)";
			var slider2 = temporalAdjustmentLayer.Effects.addProperty("ADBE Slider Control");
			slider2.name = "Time Offset (Seconds)";			
		}
		
		if (footagePanel.grp.pnlSettings6.chkGeometricalAlignment.value)
		{
			var hiddenGeometricalAdjustmentLayer = leftComp.layers.addSolid(white, footageGetItemName("Geometrical Adjustments Work"), leftComp.width, leftComp.height, leftComp.pixelAspect);
			hiddenGeometricalAdjustmentLayer.name = "Geometrical Adjustments Work";
			hiddenGeometricalAdjustmentLayer.adjustmentLayer = true;		
			
			footageFixLayer(hiddenGeometricalAdjustmentLayer);
			hiddenGeometricalAdjustmentLayer.shy = true;

			var geometricalAdjustmentLayer = leftComp.layers.addNull();
			geometricalAdjustmentLayer.name = "Geometrical Adjustments";
			geometricalAdjustmentLayer.enabled = false;

			var slider1 = geometricalAdjustmentLayer.Effects.addProperty("ADBE Slider Control");
			slider1.name = "Position (Horizontal)";
			var slider2 = geometricalAdjustmentLayer.Effects.addProperty("ADBE Slider Control");
			slider2.name = "Position (Vertical)";
			var slider3 = geometricalAdjustmentLayer.Effects.addProperty("ADBE Slider Control");
			slider3.name = "Anchor (Horizontal)";
			var slider4 = geometricalAdjustmentLayer.Effects.addProperty("ADBE Slider Control");
			slider4.name = "Anchor (Vertical)";
			var slider5 = geometricalAdjustmentLayer.Effects.addProperty("ADBE Slider Control");
			slider5.name = "Scale";
			slider5.property(1).setValue(100);
			var slider6 = geometricalAdjustmentLayer.Effects.addProperty("ADBE Slider Control");
			slider6.name = "Rotation";
			var slider7 = geometricalAdjustmentLayer.Effects.addProperty("ADBE Slider Control");
			slider7.name = "Perspective (Horizontal)";
			var slider8 = geometricalAdjustmentLayer.Effects.addProperty("ADBE Slider Control");
			slider8.name = "Perspective (Vertical)";
			
			footageFixLayer(geometricalAdjustmentLayer);

			var transform = hiddenGeometricalAdjustmentLayer.Effects.addProperty("ADBE Geometry");
			transform.name = "Transform";
			transform.property(1).expression = "[thisComp.width / 2 + thisComp.layer(\"Geometrical Adjustments\").effect(\"Anchor (Horizontal)\")(\"ADBE Slider Control-0001\"), thisComp.height / 2 + thisComp.layer(\"Geometrical Adjustments\").effect(\"Anchor (Vertical)\")(\"ADBE Slider Control-0001\")]";			
			transform.property(2).expression = "[thisComp.width / 2 + thisComp.layer(\"Geometrical Adjustments\").effect(\"Position (Horizontal)\")(\"ADBE Slider Control-0001\"), thisComp.height / 2 + thisComp.layer(\"Geometrical Adjustments\").effect(\"Position (Vertical)\")(\"ADBE Slider Control-0001\")]";
			transform.property(3).setValue(true);
			transform.property(4).expression = "thisComp.layer(\"Geometrical Adjustments\").effect(\"Scale\")(\"ADBE Slider Control-0001\")";
			transform.property(8).expression = "thisComp.layer(\"Geometrical Adjustments\").effect(\"Rotation\")(\"ADBE Slider Control-0001\")";

			var keystone = hiddenGeometricalAdjustmentLayer.Effects.addProperty("ADBE Basic 3D");
			keystone.name = "Keystone Correction";
			keystone.property(1).expression = "thisComp.layer(\"Geometrical Adjustments\").effect(\"Perspective (Vertical)\")(\"ADBE Slider Control-0001\")";
			keystone.property(2).expression = "thisComp.layer(\"Geometrical Adjustments\").effect(\"Perspective (Horizontal)\")(\"ADBE Slider Control-0001\")";
			
			hiddenGeometricalAdjustmentLayer.locked = true;			
		}
	
		if (footagePanel.grp.pnlSettings6.chkColorAlignment.value)
		{
			var colorAdjustmentsLayer = leftComp.layers.addSolid(white, footageGetItemName("Color Adjustments"), leftComp.width, leftComp.height, leftComp.pixelAspect);
			colorAdjustmentsLayer.name = "Color Adjustments";
			colorAdjustmentsLayer.adjustmentLayer = true;

			footageFixLayer(colorAdjustmentsLayer);

			var exposure = colorAdjustmentsLayer.Effects.addProperty("ADBE Exposure");
			exposure.name = "CC (Exposure)";
			var levels = colorAdjustmentsLayer.Effects.addProperty("ADBE Easy Levels");
			levels.name = "CC (Levels)";
			var hueSat = colorAdjustmentsLayer.Effects.addProperty("ADBE HUE SATURATION");
			hueSat.name = "CC (Hue/Saturation)";		
		}	

		if (footagePanel.grp.pnlSettings6.chkFW.value)
		{
			var fwAdjustmentsLayer = leftComp.layers.addSolid(white, footageGetItemName("Floating Window Adjustments"), leftComp.width, leftComp.height, leftComp.pixelAspect);
			fwAdjustmentsLayer.name = "Floating Window Adjustments";
			fwAdjustmentsLayer.adjustmentLayer = true;

			footageFixLayer(fwAdjustmentsLayer);

			var fw1 = fwAdjustmentsLayer.Effects.addProperty("ADBE Linear Wipe");
			fw1.name = "Floating Window 1";
			fw1.property(2).setValue(90);
			var fw2 = fwAdjustmentsLayer.Effects.addProperty("ADBE Linear Wipe");
			fw2.name = "Floating Window 2";
			fw2.property(2).setValue(-90);	
		}	

		// Create hidden helper layer producing a final convergence pass at the top
		var globalConvergenceLayer = leftComp.layers.addSolid(white, footageGetItemNameEx("Global Convergence",selectedItems[0].name,selectedItems[1].name), leftComp.width, leftComp.height, leftComp.pixelAspect);
		globalConvergenceLayer.name = "Global Convergence";
		globalConvergenceLayer.shy = true;
		globalConvergenceLayer.adjustmentLayer = true;
		footageFixLayer(globalConvergenceLayer);
		var transform = globalConvergenceLayer.Effects.addProperty("ADBE Geometry");
		transform.name = "Transform";
		transform.property(2).expression = "effect(\"Transform\")(2) + [-0.5 * comp(\"" + globalAdjustmentsCompName + "\").layer(\"Corrections\").effect(\"Convergence\")(\"ADBE Slider Control-0001\") + comp(\"" + globalAdjustmentsCompName + "\").layer(\"Corrections\").effect(\"Position (Horizontal)\")(\"ADBE Slider Control-0001\"), comp(\"" + globalAdjustmentsCompName + "\").layer(\"Corrections\").effect(\"Position (Vertical)\")(\"ADBE Slider Control-0001\")]";
		transform.property(3).setValue(true);
		transform.property(4).expression = "effect(\"Transform\")(4) * 0.01 * comp(\"" + globalAdjustmentsCompName + "\").layer(\"Corrections\").effect(\"Scale\")(\"ADBE Slider Control-0001\")";
		transform.property(8).expression = "effect(\"Transform\")(8) + comp(\"" + globalAdjustmentsCompName + "\").layer(\"Corrections\").effect(\"Rotation\")(\"ADBE Slider Control-0001\")";		
		
		// arrange right comp and make final touches
		/*if (footagePanel.grp.pnlSettings4.chkWorkInExistingComp.value)
		{
			for (var i = leftComp.layers.length - 1; i >= 1; --i)
				leftComp.layers[i].copyToComp(rightComp);
		}
		else
		{
			for (var i = 1; i <= leftComp.layers.length - 1; ++i)
				leftComp.layers[i].copyToComp(rightComp);
		}*/	
		for (var i = 1; i <= leftComp.layers.length - 1; ++i)
				leftComp.layers[i].copyToComp(rightComp);

		rightComp.layers[1].Effects(1).property(2).expression = "effect(\"Transform\")(2) + [0.5 * comp(\"" + globalAdjustmentsCompName + "\").layer(\"Corrections\").effect(\"Convergence\")(\"ADBE Slider Control-0001\") + comp(\"" + globalAdjustmentsCompName + "\").layer(\"Corrections\").effect(\"Position (Horizontal)\")(\"ADBE Slider Control-0001\"), comp(\"" + globalAdjustmentsCompName + "\").layer(\"Corrections\").effect(\"Position (Vertical)\")(\"ADBE Slider Control-0001\")]";

		leftComp.layers[1].locked = true;
		rightComp.layers[1].locked = true;
		leftComp.hideShyLayers = true;
		rightComp.hideShyLayers = true;
		
		if (leftComp.layers[leftComp.layers.length].locked)
			leftComp.layers[leftComp.layers.length].locked = false;
		if (footagePanel.grp.pnlSettings6.chkTemporalAlignment.value && leftComp.layers[leftComp.layers.length].canSetTimeRemapEnabled)
		{
			try
			{
				leftComp.layers[leftComp.layers.length].timeRemapEnabled = true;
				leftComp.layers[leftComp.layers.length].property("Time Remap").expression = "timeRemap + thisComp.layer(\"Temporal Adjustments\").effect(\"Time Offset (Seconds)\")((\"ADBE Slider Control-0001\")) + thisComp.layer(\"Temporal Adjustments\").effect(\"Time Offset (Frames)\")((\"ADBE Slider Control-0001\")) * thisComp.frameDuration";
			}
			catch (e) {}
		}
		if (rightComp.layers[rightComp.layers.length].locked)
			rightComp.layers[rightComp.layers.length].locked = false;
		if (footagePanel.grp.pnlSettings6.chkTemporalAlignment.value && rightComp.layers[rightComp.layers.length].canSetTimeRemapEnabled)
		{
			try
			{
				rightComp.layers[rightComp.layers.length].timeRemapEnabled = true;
				rightComp.layers[rightComp.layers.length].property("Time Remap").expression = "timeRemap + thisComp.layer(\"Temporal Adjustments\").effect(\"Time Offset (Seconds)\")((\"ADBE Slider Control-0001\")) + thisComp.layer(\"Temporal Adjustments\").effect(\"Time Offset (Frames)\")((\"ADBE Slider Control-0001\")) * thisComp.frameDuration";
			}
			catch (e) {}
		}	
		//leftComp.layers[leftComp.layers.length].locked = true;
		//rightComp.layers[rightComp.layers.length].locked = true;

		var selectedItemIndices = new Array();
		for (var i = 1; i <= items.length; ++i)
		{
			for (var j = 0; j < 2; ++j)
			{
				if (items[i] == selectedItems[j])
				{
					selectedItemIndices[j] = i;
				}
			}
		}

		if (footagePanel.grp.pnlSettings4.chkWorkInExistingComp.value && footagePanel.grp.pnlSettings3.chkCreateFolder.value)
		{
			globalAdjustmentsComp.parentFolder = folder;
		}

		// Auto advance selected items
		if (footagePanel.grp.pnlSettings3.chkAutoAdvance.value)
		{
			for (var i = 0; i < 2; ++i)
			{
				if (selectedItemIndices[i] + 1 <= items.length)
				{
					items[selectedItemIndices[i]].selected = false;
					if (!items[selectedItemIndices[i] + 1].selected)
						items[selectedItemIndices[i] + 1].selected = true;
					else if (selectedItemIndices[i] + 2 <= items.length)
						items[selectedItemIndices[i] + 2].selected = true;
				}
			}
		}
	
		if (footagePanel.grp.pnlSettings4.chkWorkInExistingComp.value && footagePanel.grp.pnlSettings3.chkCreateFolder.value)
		{
			selectedItems[0].parentFolder = folder;
			selectedItems[1].parentFolder = folder;
		}

		app.endUndoGroup();
	}
	catch (e)
	{
		alert("Error - Script aborted\n\n" + "Error name: " + e.name + "\nError message: " + e.message);
	}
}

// -----------------------------------------------------------------------------------------------------------------------------

footagePanel = footageCreateUI(this);
if (footagePanel instanceof Window)
{
	footagePanel.center();
	footagePanel.show();
}
else
	footagePanel.layout.layout(true);