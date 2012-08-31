var viewerInfoText = "Stereo Viewer v1.0\
\
---------------------------------------------------------------------\
Turns two selected items into a comp system that enables easy previewing, manipulating and rendering of stereoscopic content.\
\
The script generates at least four comps:\
One master comp (typically named \"STEREO VIEWER\"), where the multiplexed 3D preview is displayed and convergence can be set.\
Use the \"LEFT\" and \"RIGHT\" comps to render out the final mastered images.\
Probably there is also a \"GLOBAL ADJUSTMENTS\" comp, where tasks like grading can be done via adjustment layers (affecting left and right view symmetrically).\
The \„PREVIEW\“ comp contains the optimized anaglyphs; they can be overridden by turning on the \"3D Glasses\" effect in the main comp.\
---------------------------------------------------------------------\
View the info document for a detailed explanation.\
---------------------------------------------------------------------\
Legal information: This script is for free and commercial use. It is, however, not authorized for redistribution or sale.\
The author can not be held liable for any damages this script MAY cause.\
\
© 2009, Chris Keller";

// User interface
function viewerCreateUI(thisObj)
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
			chkSwap: Checkbox { text:'Swap Left + Right', value:false, alignment:['fill','top'] }, \
		}, \
		pnlSettings5: Panel { \
			text:'', alignment:['fill','top'], \
			rdAnaglyph: RadioButton { text:'Optimized Anaglyph', alignment:['left','top'], value:true }, \
			rdSideBySide: RadioButton { text:'Side By Side', alignment:['left','top'] }, \
			rdInterleaved: RadioButton { text:'Interleaved', alignment:['left','top'] }, \
		}, \
		pnlSettings6: Panel { \
			text:'', alignment:['fill','top'], \
			chkFW: Checkbox { text:'Floating Window Adjustments', value:true, alignment:['fill','top'] }, \
			chkGA: Checkbox { text:'Global Adjustments', value:true, alignment:['fill','top'] }, \
		}, \
		grp2: Group { \
			alignment:['left','top'], \
			btnGenerate: Button { text:'Generate Stereo Comps' }, \
			btnInfo: Button { text:'?', maximumSize:[25,20]}, \
		}, \
	}";
	panel.grp = panel.add(ui);

	panel.grp.pnlSettings.grp.txtName.enabled = false;

	panel.grp.pnlSettings2.grp.txtWidth.enabled = false;
	panel.grp.pnlSettings2.grp.txtHeight.enabled = false;

	var winGfx = panel.graphics;
	var darkColorBrush = winGfx.newPen(winGfx.BrushType.SOLID_COLOR, [0,0,0], 1);
	panel.grp.pnlSettings.grp.txtName.graphics.foregroundColor = darkColorBrush;
	panel.grp.pnlSettings2.grp.txtWidth.graphics.foregroundColor = darkColorBrush;
	panel.grp.pnlSettings2.grp.txtHeight.graphics.foregroundColor = darkColorBrush;

	panel.layout.layout(true);
	panel.grp.minimumSize = panel.grp.size;
	panel.layout.resize();
	panel.onResizing = panel.onResize = function () {this.layout.resize();}

	panel.grp.grp2.btnGenerate.onClick = viewerOnButtonClick;
	panel.grp.grp2.btnInfo.onClick = viewerOnInfoClick;
	panel.grp.pnlSettings.chkAutomaticNaming.onClick = viewerOnCheckBoxClick;
	panel.grp.pnlSettings2.chkKeepRes.onClick = viewerOnCheckBoxClick2;
	
	return panel;
}

// -----------------------------------------------------------------------------------------------------------------------------

function viewerOnCheckBoxClick()
{
	if (viewerPanel.grp.pnlSettings.chkAutomaticNaming.value)
	{
		viewerPanel.grp.pnlSettings.grp.txtName.enabled = false;
		viewerPanel.grp.pnlSettings.grp.txtName.text = "(automatic)";
	}
	else
	{
		viewerPanel.grp.pnlSettings.grp.txtName.enabled = true;
		viewerPanel.grp.pnlSettings.grp.txtName.text = viewerGetNewCompName();
	}	
}

// -----------------------------------------------------------------------------------------------------------------------------

function viewerOnCheckBoxClick2()
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
	
	if (viewerPanel.grp.pnlSettings2.chkKeepRes.value)
	{
		viewerPanel.grp.pnlSettings2.grp.txtWidth.enabled = false;
		viewerPanel.grp.pnlSettings2.grp.txtWidth.text = "(auto)";
		viewerPanel.grp.pnlSettings2.grp.txtHeight.enabled = false;
		viewerPanel.grp.pnlSettings2.grp.txtHeight.text = "(auto)";
	}
	else
	{
		viewerPanel.grp.pnlSettings2.grp.txtWidth.enabled = true;
		viewerPanel.grp.pnlSettings2.grp.txtWidth.text = item != null ? item.width.toString() : "1920";
		viewerPanel.grp.pnlSettings2.grp.txtHeight.enabled = true;
		viewerPanel.grp.pnlSettings2.grp.txtHeight.text = item != null ? item.height.toString() : "1080";
	}
}

// -----------------------------------------------------------------------------------------------------------------------------

function viewerGetUniqueItemName(name)
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

function viewerGetItemName(name)
{
	if (name.length > 31)
		name = name.slice(0, 30 - (name.length + 1));
	return viewerGetUniqueItemName(name);
}

// -----------------------------------------------------------------------------------------------------------------------------

function viewerGetItemNameEx(name, leftArg, rightArg)
{
	var leftLength = Math.ceil((31 - name.length - 2) * 0.5);
	if (leftArg.length > leftLength)
		leftArg = leftArg.slice(0, leftLength);
	var rightLength = Math.floor((31 - name.length - 2) * 0.5);
	if (rightArg.length > rightLength)
		rightArg = rightArg.slice(0, rightLength);
	return viewerGetUniqueItemName(name + " " + leftArg + "+" + rightArg);
}

// -----------------------------------------------------------------------------------------------------------------------------

function viewerGetNewCompName()
{
	var compName  = "STEREO VIEWER";
	return compName;
}

// -----------------------------------------------------------------------------------------------------------------------------

function viewerOnInfoClick()
{
	alert(viewerInfoText);
}

// -----------------------------------------------------------------------------------------------------------------------------

// Main function
function viewerOnButtonClick()
{
	try
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
		
		if (selectedItems.length != 2)
		{
			alert("Please select the left and right composition.");
			return;
		}

		app.beginUndoGroup("Stereo Viewer");

		var compName = "";
		try
		{
			compName = viewerGetItemName(viewerPanel.grp.pnlSettings.chkAutomaticNaming.value ? viewerGetNewCompName(): viewerPanel.grp.pnlSettings.grp.txtName.text);
		}
		catch (e) { alert ("Could not access panel. Please restart the script."); app.endUndoGroup(); return;} 
		var tmpCompName = compName;

		var folder = viewerPanel.grp.pnlSettings3.chkCreateFolder.value ? selectedItems[0].parentFolder.items.addFolder(compName) : selectedItems[0].parentFolder;

		for (var i = 0; i < 2; ++i)
		{
			if (!(selectedItems[i] instanceof CompItem))
			{
				var duration, frameRate;
				if (selectedItems[i] instanceof FootageItem && selectedItems[i].mainSource.isStill)
				{
					duration = 1;
					frameRate = 1;
				}
				else
				{
					duration = selectedItems[i].duration;
					frameRate = selectedItems[i].frameRate;
				}
				var tmpComp = folder.items.addComp(viewerGetItemName(selectedItems[i].name + " Comp"), selectedItems[i].width, selectedItems[i].height, selectedItems[i].pixelAspect, duration, frameRate);
				tmpComp.layers.add(selectedItems[i]);
				selectedItems[i] = tmpComp;
			}
		}

		var leftComp;
		var rightComp;
		if (viewerPanel.grp.pnlSettings4.chkSwap.value)
		{
			leftComp = selectedItems[1];
			rightComp = selectedItems[0];
		}
		else
		{
			leftComp = selectedItems[0];
			rightComp = selectedItems[1];
		}
		
		// Determinate width and height
		var width = 0;
		var height = 0;

		var keepRes = viewerPanel.grp.pnlSettings2.chkKeepRes.value;
		var widthText = viewerPanel.grp.pnlSettings2.grp.txtWidth.text;
		var heightText = viewerPanel.grp.pnlSettings2.grp.txtHeight.text;
		if (keepRes)
			width = leftComp.width;
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
			height = leftComp.height;
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

		// Create main composition
		var comp = folder.items.addComp(compName, width, height, leftComp.pixelAspect, leftComp.duration, leftComp.frameRate);

		comp.bgColor = leftComp.bgColor;
		comp.comment = leftComp.comment;
		comp.displayStartTime = leftComp.displayStartTime;
		comp.draft3d = leftComp.draft3d;
		comp.duration = leftComp.duration;
		comp.frameBlending = leftComp.frameBlending;
		comp.frameDuration = leftComp.frameDuration;
		comp.frameRate = leftComp.frameRate;
		comp.height = height;
		comp.hideShyLayers = true;
		comp.motionBlur = leftComp.motionBlur;
		comp.pixelAspect = leftComp.pixelAspect;
		comp.preserveNestedFrameRate = leftComp.preserveNestedFrameRate;
		comp.preserveNestedResolution = leftComp.preserveNestedResolution;
		comp.renderer = leftComp.renderer;
		comp.resolutionFactor = leftComp.resolutionFactor;
		comp.shutterAngle = leftComp.shutterAngle;
		comp.shutterPhase = leftComp.shutterPhase;
		try
		{
			comp.time = leftComp.time;
		}
		catch (e) {}
		comp.useProxy = leftComp.useProxy;
		comp.width = width;
		try
		{
			comp.workAreaStart = leftComp.workAreaStart;
		}
		catch (e) {}
		try
		{
			comp.workAreaDuration = leftComp.workAreaDuration - 0.01;
		}
		catch (e) {}	
		
		// Add left and right layers
		var rightLayer = comp.layers.add(rightComp);
		rightLayer.startTime = 0;
		var leftLayer = comp.layers.add(leftComp);
		leftLayer.startTime = 0;

		// Precomp left and right layers
		var index = new Array();
		index[0] = 1;
		var leftPreComp = comp.layers.precompose(index, viewerGetItemName(compName + " LEFT"), false);
		leftPreComp.width = comp.width;
		leftPreComp.height = comp.height;
		index[0] = 2;
		var rightPreComp = comp.layers.precompose(index, viewerGetItemName(compName + " RIGHT"), false);
		rightPreComp.width = comp.width;
		rightPreComp.height = comp.height;
		
		// Create preview comp and optimized Anaglyph effect
		comp.layers[1].duplicate();
		comp.layers[3].duplicate();
		var indices = new Array();
		indices[0] = 1;
		indices[1] = 3;
		var stereoPreview = comp.layers.precompose(indices, viewerGetItemName(compName + " PREVIEW"), true);
		stereoPreview.width = comp.width;
		stereoPreview.height = comp.height;

		comp.layers[1].Effects.addProperty("ADBE 3D Glasses");
		comp.layers[1].Effects(1).property(1).setValue(2);
		comp.layers[1].Effects(1).property(2).setValue(3);
		comp.layers[1].Effects(1).property(5).setValue(viewerPanel.grp.pnlSettings5.rdSideBySide.value ? 1 : (viewerPanel.grp.pnlSettings5.rdInterleaved.value ? 2 : 10));
		comp.layers[1].Effects(1).enabled = viewerPanel.grp.pnlSettings5.rdSideBySide.value || viewerPanel.grp.pnlSettings5.rdInterleaved.value;

		stereoPreview.layers[1].Effects.addProperty("ADBE CHANNEL MIXER");
		stereoPreview.layers[1].Effects(1).name = "Shift Reds";
		stereoPreview.layers[1].Effects(1).property(1).setValue(0);
		stereoPreview.layers[1].Effects(1).property(5).setValue(30);
		stereoPreview.layers[1].Effects(1).property(6).setValue(70);
		stereoPreview.layers[1].Effects(1).property(9).setValue(30);
		stereoPreview.layers[1].Effects(1).property(11).setValue(70);
		stereoPreview.layers[1].Effects.addProperty("ADBE CHANNEL MIXER");
		stereoPreview.layers[1].Effects(2).property(1).setValue(0);
		stereoPreview.layers[1].Effects(2).property(2).setValue(70);
		stereoPreview.layers[1].Effects(2).property(3).setValue(30);
		stereoPreview.layers[1].Effects(2).property(6).setValue(0);
		stereoPreview.layers[1].Effects(2).property(11).setValue(0);
		stereoPreview.layers[1].blendingMode = BlendingMode.ADD;
		stereoPreview.layers[1].Effects.addProperty("ADBE Easy Levels");
		stereoPreview.layers[1].Effects(3).property(5).setValue(1.5);
			
		stereoPreview.layers[2].Effects.addProperty("ADBE CHANNEL MIXER");
		stereoPreview.layers[2].Effects(1).name = "Shift Reds";
		stereoPreview.layers[2].Effects(1).property(5).setValue(30);
		stereoPreview.layers[2].Effects(1).property(6).setValue(70);
		stereoPreview.layers[2].Effects(1).property(9).setValue(30);
		stereoPreview.layers[2].Effects(1).property(11).setValue(70);
		stereoPreview.layers[2].Effects.addProperty("ADBE CHANNEL MIXER");
		stereoPreview.layers[2].Effects(2).property(1).setValue(0);
		
		comp.layers[2].collapseTransformation = true;
		comp.layers[3].collapseTransformation = true;
		comp.layers[2].enabled = false;
		comp.layers[3].enabled = false;
		comp.layers[2].shy = true;
		comp.layers[3].shy = true;
		
		var stereoControls = comp.layers.addNull();
		stereoControls.name = "Stereo Controls";
		 
		// Create and link stereo controls
		var slider = stereoControls.Effects.addProperty("ADBE Slider Control");
		slider.name = "Convergence";
		var slider2 = stereoControls.Effects.addProperty("ADBE Slider Control");
		slider2.name = "Scale";
		slider2.property(1).setValue(100);
		stereoControls.enabled = false;
		
		leftPreComp.layers[1].position.expression = "transform.position - [0.5 * comp(\"" + compName + "\").layer(\"Stereo Controls\").effect(\"Convergence\")(\"ADBE Slider Control-0001\"), 0]";
		leftPreComp.layers[1].scale.expression = "transform.scale * 0.01 * comp(\"" + compName + "\").layer(\"Stereo Controls\").effect(\"Scale\")(\"ADBE Slider Control-0001\")";
		rightPreComp.layers[1].position.expression = "transform.position + [0.5 * comp(\"" + compName + "\").layer(\"Stereo Controls\").effect(\"Convergence\")(\"ADBE Slider Control-0001\"), 0]";
		rightPreComp.layers[1].scale.expression = "transform.scale * 0.01 * comp(\"" + compName + "\").layer(\"Stereo Controls\").effect(\"Scale\")(\"ADBE Slider Control-0001\")";
		
		// Floating Window Adjustments
		if (viewerPanel.grp.pnlSettings6.chkFW.value)
		{
			var white = new Array();
			white[0] = 1;
			white[1] = 1;
			white[2] = 1;
			var fwLayer = leftPreComp.layers.addSolid(white, viewerGetItemName(compName + " Local Adjustments"), leftPreComp.width, leftPreComp.height, leftPreComp.pixelAspect);
			fwLayer.name = "Local Adjustments";
			fwLayer.adjustmentLayer = true;
			var fw1 = fwLayer.Effects.addProperty("ADBE Linear Wipe");
			fw1.name = "Floating Window 1";
			fw1.property(2).setValue(90);
			var fw2 = fwLayer.Effects.addProperty("ADBE Linear Wipe");
			fw2.name = "Floating Window 2";
			fw2.property(2).setValue(-90);	
			fwLayer.copyToComp(rightPreComp);
		}

		// Global Adjustments
		if (viewerPanel.grp.pnlSettings6.chkGA.value)
		{
			var globalAdjustmentsComp = folder.items.addComp(viewerGetItemName(compName + " GLOBAL ADJUSTMENTS"), leftComp.width, leftComp.height, leftComp.pixelAspect, leftComp.duration, leftComp.frameRate);
			var globalAdjustmentsLayer = leftPreComp.layers.add(globalAdjustmentsComp);
			globalAdjustmentsLayer.startTime = 0;
			leftPreComp.layers[1].name = "Global Adjustments";
			globalAdjustmentsLayer.collapseTransformation = true;
			globalAdjustmentsLayer = rightPreComp.layers.add(globalAdjustmentsComp);
			rightPreComp.layers[1].name = "Global Adjustments";
			globalAdjustmentsLayer.startTime = 0;
			globalAdjustmentsLayer.collapseTransformation = true;
		}
	
		// Auto advance selected items
		if (viewerPanel.grp.pnlSettings3.chkAutoAdvance.value)
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
		app.endUndoGroup();
	}
	catch (e)
	{
		alert("Error - Script aborted\n\n" + "Error name: " + e.name + "\nError message: " + e.message);
	}
}

// -----------------------------------------------------------------------------------------------------------------------------

viewerPanel = viewerCreateUI(this);
if (viewerPanel instanceof Window)
{
	viewerPanel.center();
	viewerPanel.show();
}
else
	viewerPanel.layout.layout(true);