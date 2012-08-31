var converterInfoText = "Stereo Converter v1.0 \
\
---------------------------------------------------------------------\
Duplicates a comp, applies a flexible stereo rig to all cameras and performs other user defined 3D operations.\
This way, stereo compositing is facilitated, since you can work in only one (the left) comp, and the right comp is automatically calculated.\
It should be regenerated with every major change and otherwise remain unmodified.\
In 3D scenes, you can control the amount of camera separation via the \"Separation\" slider on the \"Stereo Controls\" null object.\
---------------------------------------------------------------------\
This script provides a huge variety of extra features that are not directly visible.\
View the info document for a detailed explanation.\
---------------------------------------------------------------------\
Legal information: This script is for free and commercial use. It is, however, not authorized for redistribution or sale.\
The author can not be held liable for any damages this script MAY cause.\
\
© 2009, Chris Keller";

// User interface
function converterCreateUI(thisObj)
{
	var panel = (thisObj instanceof Panel) ? thisObj : new Window("palette", "Stereo Converter", undefined, {resizeable:true});
	
	var ui = 
	"group { \
		orientation:'column', alignment:['fill','top'], \
		pnlSettings: Panel { \
			alignment:['fill','top'] ,\
			chkAutomaticNaming: Checkbox { text:'Automatic Naming', alignment:['left','top'], value:true }, \
			grp: Group { \
				alignment:['fill','top'], \
				txtName: EditText {text:'(automatic)', characters:31, alignment:['left','center'] }, \
			}, \
		}, \
		pnlSettings2: Panel { \
			alignment:['fill','top'] ,\
			chkLinkProperties: Checkbox { text:'Auto Link Properties', value:false, alignment:['fill','top'] }, \
		}, \
		pnlSettings3: Panel { \
			alignment:['fill','top'] ,\
			grp: Group { \
				alignment:['left','top'], \
				btnMarkAsFootage: Button { text:'Mark As Footage'  }, \
				btnUnmarkAsFootage: Button { text:'Unmark As Footage'  }, \
			}, \
		}, \
		grp2: Group { \
			alignment:['left','top'], \
			btnConvert: Button { text:'Generate Right Comp' }, \
			btnInfo: Button { text:'?', maximumSize:[25,20]}, \
		}, \
	}";
	panel.grp = panel.add(ui);
	  
	panel.grp.pnlSettings.grp.txtName.enabled = false;

	var winGfx = panel.graphics;
	var darkColorBrush = winGfx.newPen(winGfx.BrushType.SOLID_COLOR, [0,0,0], 1);
	panel.grp.pnlSettings.grp.txtName.graphics.foregroundColor = darkColorBrush;

	panel.layout.layout(true);
	panel.grp.minimumSize = panel.grp.size;
	panel.layout.resize();
	panel.onResizing = panel.onResize = function () {this.layout.resize();}

	panel.grp.pnlSettings3.grp.btnMarkAsFootage.onClick = converterOnButtonClick2;
	panel.grp.pnlSettings3.grp.btnUnmarkAsFootage.onClick = converterOnButtonClick3;
	panel.grp.grp2.btnConvert.onClick = converterOnButtonClick;
	panel.grp.grp2.btnInfo.onClick = converterOnInfoClick;
	panel.grp.pnlSettings.chkAutomaticNaming.onClick = converterOnCheckBoxClick;
	
	return panel;
}

// -----------------------------------------------------------------------------------------------------------------------------

function converterOnCheckBoxClick()
{
	if (this.parent.parent.pnlSettings.chkAutomaticNaming.value)
	{
		this.parent.parent.pnlSettings.grp.txtName.enabled = false;
		this.parent.parent.pnlSettings.grp.txtName.text = "(automatic)";
	}
	else
	{
		this.parent.parent.pnlSettings.grp.txtName.enabled = true;
		this.parent.parent.pnlSettings.grp.txtName.text = converterGetNewCompName(null);
	}	
}

// -----------------------------------------------------------------------------------------------------------------------------

function converterOnInfoClick()
{
	alert(converterInfoText);
}

// -----------------------------------------------------------------------------------------------------------------------------

function converterOnButtonClick2()
{
	var selectedComp = app.project.activeItem;
	if ((selectedComp != null) && (selectedComp instanceof CompItem))
	{
		app.beginUndoGroup("Mark As Footage");
		var layers = selectedComp.selectedLayers;
		for (var i = 0; i < layers.length; ++i)
		{
			var j;
			for (var j = 1; j <= selectedComp.layers.length; ++j)
			if (selectedComp.layers[j] == layers[i])
				break;
			if (j == selectedComp.layers.length)
				alert("The last layer in a comp can not be marked as footage. It has to be followed by a layer containing the right footage.");
			else
				if (layers[i].comment.indexOf("STEREO FOOTAGE\r\n") == 0)
					alert(layers[i].name  + " is already marked as footage.");
				else
					layers[i].comment = "STEREO FOOTAGE\r\n" + layers[i].comment;
		}
		app.endUndoGroup();
	}
}

// -----------------------------------------------------------------------------------------------------------------------------

function converterOnButtonClick3()
{
	var selectedComp = app.project.activeItem;
	if ((selectedComp != null) && (selectedComp instanceof CompItem))
	{
		app.beginUndoGroup("Unmark As Footage");
		var layers = selectedComp.selectedLayers;
		for (var i = 0; i < layers.length; ++i)
		{
			if (layers[i].comment.indexOf("STEREO FOOTAGE\r\n") == 0)
				layers[i].comment = layers[i].comment.slice(17, layers[i].comment.length)
			else
				alert(layers[i].name + " was not marked as footage.");
		}
		app.endUndoGroup();
	}
}

// -----------------------------------------------------------------------------------------------------------------------------

function converterGetUniqueItemName(name)
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

function converterGetItemName(name)
{
	if (name.length > 31)
		name = name.slice(0, 30 - (name.length + 1));
	return converterGetUniqueItemName(name);
}

// -----------------------------------------------------------------------------------------------------------------------------

// Main function - Starts conversion process
function converterOnButtonClick()
{
	var selectedComp = app.project.activeItem;
	if ((selectedComp != null) && (selectedComp instanceof CompItem))
	{
		app.beginUndoGroup("Stereo Converter");

		// Search for control layer - if not found, add control layer
		var stereoControls;

		var layers = selectedComp.layers;
		
		var cameraFound = false;
		for (var i = 1; i <= layers.length; ++i)
			if (layers[i] instanceof CameraLayer)
			{
				cameraFound = true;
				break;
			}

		if (cameraFound)
		{
			var nullFound = false;
			for (var i = 1; i <= layers.length; ++i)
				if (layers[i].nullLayer && layers[i].name == "Stereo Controls")
				{
					stereoControls = layers[i];
					nullFound = true;
					break;
				}
				
			if (!nullFound)
			{
				stereoControls = layers.addNull(selectedComp.duration);
				stereoControls.name = "Stereo Controls";
				stereoControls.enabled = false;
			}
		
			// Search for separation slider - if not found, add separation slider
			var effectFound = false;
			var effectsGroup = stereoControls("Effects");
			for (var i = 1; i <= effectsGroup.numProperties; ++i)
				if (effectsGroup.property(i).matchName == "ADBE Slider Control" && effectsGroup.property(i).name == "Camera Separation")
				{
					effectFound = true;
					break;
				};

			if (!effectFound)
			{
				var slider = effectsGroup.addProperty("ADBE Slider Control");
				slider.name = "Camera Separation";
				slider.minValue = 0;
				slider.maxValue = 250;
			}
		}

		// Create unique layer names
		var doublesFound;
		var doubleAlert = false;
		do
		{
			doublesFound = false;
			var layerNames = new Array();
			var layers = selectedComp.layers;
			for (var i = 1; i <= layers.length; ++i)
			{
				if (layerNames[layers[i].name] == undefined)
					layerNames[layers[i].name] = 1;
				else
				{
					layerNames[layers[i].name]++;
					if (layerNames[layers[i].name] > 1)
					{
						doublesFound = true;
						if (!doubleAlert)
						{
							alert ("Double layer names detected. To link all properties correctly, every layer has to have a unique name. Affected layers have been renamed. You can undo and rename manually.");
							doubleAlert = true;
						}
						var locked = layers[i].locked;
						if (locked)
							layers[i].locked = false;
						var newLayerName = layers[i].name;
						if ((newLayerName + " " + layerNames[layers[i].name]).length > 31)
							newLayerName = newLayerName.slice(0, 30 - (layerNames[layers[i].name].toString().length + 1));
						layers[i].name = newLayerName + " " + layerNames[layers[i].name];
						if (locked)
							layers[i].locked = true;
					}
				}
			}
		} while (doublesFound);

		// Create left and right composition
		converterConvert(selectedComp);
				
		app.endUndoGroup();
	}
	else
		alert("Please select the main composition.");
}

// -----------------------------------------------------------------------------------------------------------------------------

function converterGetNewCompName(leftComp)
{
	var selectedCompName = "";
	if (leftComp == null)
	{
		if (app.project.activeItem != null)
			selectedCompName = app.project.activeItem.name;
	}
	else
	{
		selectedCompName = leftComp.name;
	}

	if (selectedCompName.toUpperCase().indexOf("LEFT") != -1)
		selectedCompName = selectedCompName.slice(0, selectedCompName.toUpperCase().indexOf("LEFT"));	

	if (selectedCompName.length > 25)
		selectedCompName = selectedCompName.slice(0, 25);

	if (selectedCompName[selectedCompName.length - 1] != " ")
		selectedCompName += " ";
		
	return selectedCompName + "RIGHT";
}

// -----------------------------------------------------------------------------------------------------------------------------

// Recursively goes through all properties and links them to the main comp
function converterProcessExpressions(parentProperty, propertyName)
{
	if (parentProperty != null)
	{
		for (var i = 1; i <= parentProperty.numProperties; ++i)
		{
			var property = parentProperty.property(i);

			if (property.propertyType == PropertyType.PROPERTY && property.canSetExpression)
			{
				try
				{
					if (property.enabled)
					{
						property.expression = propertyName + "(\"" + property.matchName + "\")";
						property.expressionEnabled = true;
					}
				} catch (e) {}
			}
			else if ((property.propertyType == PropertyType.INDEXED_GROUP) || (property.propertyType == PropertyType.NAMED_GROUP))
				converterProcessExpressions(property, propertyName + "(\"" + property.name + "\")");
		}
	}	
}

// -----------------------------------------------------------------------------------------------------------------------------

// Recursively goes through all expressions and reacts if "// STEREO IGNORE" or "// STEREO OFFSET" is detected
function converterParseExpressions(parentProperty, mainParentProperty)
{
	if (parentProperty != null)
	{
		for (var i = 1; i <= parentProperty.numProperties; ++i)
		{
			var property = parentProperty.property(i);
			var mainProperty = mainParentProperty.property(i);
			
			if (mainProperty.propertyType == PropertyType.PROPERTY && mainProperty.canSetExpression && mainProperty.expression != "" && mainProperty.expressionEnabled)
			{
				try
				{
					var ignoreString = "// STEREO IGNORE\r\n";
					var offsetString = "// STEREO OFFSET ";
					var expr = mainProperty.expression;
					if (expr.toUpperCase().indexOf(ignoreString) == 0)
					{
						property.expression = expr.slice(ignoreString.length, expr.length);
					}
					else if (expr.toUpperCase().indexOf(offsetString) == 0)
					{
						var lineBreakPos = expr.indexOf("\r\n");
						if (lineBreakPos != -1)
						{
							var parameter = expr.slice(offsetString.length, offsetString.length + lineBreakPos - offsetString.length);
							
							var finalParameter;
							if (mainProperty.propertyValueType == PropertyValueType.ThreeD_SPATIAL || mainProperty.propertyValueType == PropertyValueType.ThreeD)
								finalParameter = "[" + parameter + ", 0, 0]";
							else if (mainProperty.propertyValueType == PropertyValueType.TwoD_SPATIAL || mainProperty.propertyValueType == PropertyValueType.TwoD)
								finalParameter = "[" + parameter + ", 0]";
							else
								finalParameter = parameter;
							if (expr.charAt(expr.length - 1) == ";")
								 expr = expr.slice(0, expr.length - 1);
							property.expression = expr.slice(lineBreakPos + 2, expr.length) +  " + " + finalParameter + ";";
						}
					}
				} catch (e) {}
			}
			else if ((property.propertyType == PropertyType.INDEXED_GROUP) || (property.propertyType == PropertyType.NAMED_GROUP))
				converterParseExpressions(property, mainProperty);
		}
	}	
}

// -----------------------------------------------------------------------------------------------------------------------------

// Recursively goes through all properties and updates the layer index properties (which get lost when copying)
function converterUpdateLayerIndexProperties(parentProperty, mainParentProperty)
{
	if (parentProperty != null)
	{
		for (var i = 1; i <= parentProperty.numProperties; ++i)
		{
			var property = parentProperty.property(i);
			var mainProperty = mainParentProperty.property(i);

			if (property.propertyType == PropertyType.PROPERTY && property.propertyValueType == PropertyValueType.LAYER_INDEX)
			{
				try
				{
						property.setValue(mainProperty.value);
				} catch (e) {}
			}
			else if ((property.propertyType == PropertyType.INDEXED_GROUP) || (property.propertyType == PropertyType.NAMED_GROUP))
				converterUpdateLayerIndexProperties(property, mainProperty);
		}
	}	
}

// -----------------------------------------------------------------------------------------------------------------------------

// Recursively goes through all properties and updates possible mask index properties, if masks have been swapped
function converterUpdateMaskIndexProperties(parentProperty, maskIndexToChange, offsetDirection)
{
	if (parentProperty != null)
	{
		for (var i = 1; i <= parentProperty.numProperties; ++i)
		{
			var property = parentProperty.property(i);

			if (property.propertyType == PropertyType.PROPERTY && property.propertyValueType == PropertyValueType.MASK_INDEX && property.value == maskIndexToChange)
			{
				try
				{
						property.setValue(maskIndexToChange + offsetDirection);
				} catch (e) {}
			}
			else if ((property.propertyType == PropertyType.INDEXED_GROUP) || (property.propertyType == PropertyType.NAMED_GROUP))
				converterUpdateMaskIndexProperties(property, maskIndexToChange);
		}
	}	
}

// -----------------------------------------------------------------------------------------------------------------------------

// Saves all expression states into the global array "states" and disables expressions
function converterDisableExpressions(parentProperty)
{
	if (parentProperty != null)
	{
		for (var i = 1; i <= parentProperty.numProperties; ++i)
		{
			var property = parentProperty.property(i);

			if (property.propertyType == PropertyType.PROPERTY)
			{
				try
				{
					if (property.canSetExpression)
					{
						states[layerIndex][propertyIndex++] = property.expressionEnabled;
						property.expressionEnabled = false;
					}
				} catch (e) {}
			}
			else if ((property.propertyType == PropertyType.INDEXED_GROUP) || (property.propertyType == PropertyType.NAMED_GROUP))
			{
				converterDisableExpressions(property);
			}
		}
	}
}

// -----------------------------------------------------------------------------------------------------------------------------

// Restores all expression states from the global array "states"
function converterRestoreExpressions(parentProperty)
{
	if (parentProperty != null)
	{
		for (var i = 1; i <= parentProperty.numProperties; ++i)
		{
			var property = parentProperty.property(i);

			if (property.propertyType == PropertyType.PROPERTY)
			{
				try
				{
					if (property.canSetExpression)
						property.expressionEnabled = states[layerIndex][propertyIndex++];
				} catch (e) {}
			}
			else if ((property.propertyType == PropertyType.INDEXED_GROUP) || (property.propertyType == PropertyType.NAMED_GROUP))
				converterRestoreExpressions(property);
		}
	}	
}

// -----------------------------------------------------------------------------------------------------------------------------

// Checks two properties by their names and determines if they belong together as a stereo pair
function converterCheckIfStereoPair(firstName, secondName)
{
	firstName = firstName.toUpperCase();
	secondName = secondName.toUpperCase();

	if (firstName.length > 5 && firstName.indexOf(".LEFT") == firstName.length - 5)
	{
		if ((secondName == firstName.slice(0, firstName.length - 5)) || (secondName == (firstName.slice(0, firstName.length - 5) + ".RIGHT")))
			return 1;
	}
	else if (firstName.length > 6 && firstName.indexOf(".RIGHT") == firstName.length - 6)
	{
		if ((secondName == firstName.slice(0, firstName.length - 6)) || (secondName == (firstName.slice(0, firstName.length - 6) + ".LEFT")))
			return 2;
	}
	else
	{
		if (secondName == firstName + ".LEFT")
			return 2;
		else if (secondName == firstName + ".RIGHT")
			return 1;
	}

	return false;
}

// -----------------------------------------------------------------------------------------------------------------------------

// Creates a copy of the main composition, possibly links all properties and calculates camera settings
function converterConvert(leftComp)
{	
	try
	{
		var folder = leftComp.parentFolder;

		var name = "";
		try
		{
			name =  converterPanel.grp.pnlSettings.grp.txtName.enabled ? converterPanel.grp.pnlSettings.grp.txtName.text : converterGetNewCompName(leftComp);
		}
		catch (e) { alert ("Could not access panel. Please restart the script."); app.endUndoGroup(); return;} 
		if (name.length > 31)
			name = name.slice(0, 30 - (name.length + 1));
		
		var comp;

		// Find out if the new composition already exist 
		var found = false;
		for (var i = 1; i <= folder.numItems; ++i)
		{
			var item = folder.item(i);
			if (item instanceof CompItem && (item.name == name))
			{
				comp = item;
				found = true;
				break;
			}
		}

		if (!found)
		{
			comp = leftComp.duplicate();
			comp.name = name;
			//comp = folder.items.addComp(name, leftComp.width, leftComp.height, leftComp.pixelAspect, leftComp.duration, leftComp.frameRate);
		}
	
		// empty the comp by removing all layers
		var layers = comp.layers;
		while (layers.length > 0)
		try
		{
			if (layers[1])
				layers[1].locked = false;
			layers[1].remove();
		}
		catch (e) {}	

		// for safety, copy all parameters from the left comp (deprecated)
		comp.bgColor = leftComp.bgColor;
		comp.comment = leftComp.comment;
		comp.displayStartTime = leftComp.displayStartTime;
		comp.draft3d = leftComp.draft3d;
		comp.duration = leftComp.duration;
		comp.frameBlending = leftComp.frameBlending;
		comp.frameDuration = leftComp.frameDuration;
		comp.frameRate = leftComp.frameRate;
		comp.height = leftComp.height;
		comp.hideShyLayers = leftComp.hideShyLayers;
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
		comp.width = leftComp.width;
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
		
		// Copy all layers to the new composition
		var layers = leftComp.layers;
		states = new Array();
		layerIndex = 0;
		for (var i = layers.length; i >= 1; --i)
		{
			var locked = layers[i].locked;
			if (locked)
				layers[i].locked = false;
			var parent = layers[i].parent;
			layers[i].parent = null;
			
			states[layerIndex] = new Array();
			propertyIndex = 0;
			converterDisableExpressions(layers[i]);

			// Avoid circular references
			if (layers[i].source == comp)
			{
				for (var j = 1; j <= folder.numItems; ++j)
				{
					var item = folder.item(j);
					if (item.name == "STEREO: Right Comp Placeholder")
					{
						item.remove();
						break;
					}
				}

				var tmpComp = folder.items.addComp(converterGetItemName("STEREO tmpComp"), leftComp.width, leftComp.height, leftComp.pixelAspect, leftComp.duration, leftComp.frameRate);
				/*var text = tmpComp.layers.addText();
				text.sourceText = "Script Working Comp. If you see this, something went wrong - just delete it.";
				text.guideLayer = true;*/
				var placeHolder = tmpComp.layers.addNull();
				placeHolder.name = "STEREO: Right Comp Placeholder";
				placeHolder.source.name = "STEREO: Right Comp Placeholder";
				placeHolder.source.parentFolder = folder;
				placeHolder.enabled = false;
				placeHolder.copyToComp(comp);
				tmpComp.remove();
			}
			else
				layers[i].copyToComp(comp);
			
			layers[i].parent = parent;
			if (locked)
			{
				layers[i].locked = true;
				comp.layers[1].locked = true;
			}
		
			layerIndex++;
		}

		layerIndex = 0;
		for (var i = layers.length; i >= 1; --i)
		{
			propertyIndex = 0;
			converterRestoreExpressions(layers[i]);
			layerIndex++;
		}
		layers = comp.layers;
		layerIndex = 0;
		for (var i = layers.length; i >= 1; --i)
		{
			propertyIndex = 0;
			converterRestoreExpressions(layers[i]);
			layerIndex++;
		}
			
		// Update parents
		layers = comp.layers;
		for (var i = 1; i <= layers.length; ++i)
			if (leftComp.layers[i].parent != null)
			{
				var locked = layers[i].locked;
				if (locked)
					layers[i].locked = false;
				layers[i].parent = layers[leftComp.layers[i].parent.index];
				if (locked)
					layers[i].locked = true;
			}

		// Iterate through all new layers and possibly link their properties to the main composition
		layers = comp.layers;
		for (var i = 1; i <= layers.length; ++i)
		{
			// Replace layer sources when marked as footage
			if (layers[i].comment.indexOf("STEREO FOOTAGE\r\n") == 0 && i != layers.length)
			{
				try
				{
					layers[i].replaceSource(layers[i + 1].source, true);
				}
				catch (e)
				{
					alert("A problem occured while replacing the source of " + layers[i].name);
				}
			}
			
			var layerPath = "comp(\"" + leftComp.name + "\").layer(\"" + layers[i].name + "\")";
			
			var locked = layers[i].locked;
			if (locked)
				layers[i].locked = false;
				
			if (converterPanel.grp.pnlSettings2.chkLinkProperties.value && layers[i].name != "STEREO: Right Comp Placeholder" && layers[i].name != "STEREO: not used in this comp")
				converterProcessExpressions(layers[i], layerPath); // link properties

			converterParseExpressions(layers[i], leftComp.layers[i]); //  parse expressions
			if (locked)
				layers[i].locked = true;	

			// Iterate through effects and swap if a stereo pair has been detected
			var effects = layers[i].Effects;
			if (effects != null)
			{
				for (var j = 2; j <= effects.numProperties; ++j)
				{
					var oldEffect = effects.property(j - 1);
					var currentEffect = effects.property(j);				

					var stereoPair = converterCheckIfStereoPair(oldEffect.name, currentEffect.name);
					if (stereoPair > 0)
					{
						if (stereoPair == 2)
						{
							oldEffect = effects.property(j);
							currentEffect = effects.property(j - 1);				
						}
						
						currentEffect.name = oldEffect.name;
						oldEffect.name = "STEREO: not used in this comp";
						
						currentEffect.enabled = oldEffect.enabled;
						oldEffect.enabled = false;							
						
						oldEffect.moveTo(j - (stereoPair == 1 ? 0 : 1));
					}
					else
					{
						var oldEffectName = oldEffect.name.toUpperCase();
						if (oldEffectName.length > 5 && oldEffectName.indexOf(".LEFT") == oldEffectName.length - 5)
							oldEffect.enabled = false;
						else if (oldEffectName.length > 6 && oldEffectName.indexOf(".RIGHT") == oldEffectName.length - 6)
							oldEffect.enabled = true;
					}
				}
				if (effects.numProperties > 0)
				{
					var effectName = effects.property(effects.numProperties).name.toUpperCase();
					if (effectName.length > 5 && effectName.indexOf(".LEFT") == effectName.length - 5)
						effects.property(effects.numProperties).enabled = false;
					else if (effectName.length > 6 && effectName.indexOf(".RIGHT") == effectName.length - 6)
						effects.property(effects.numProperties).enabled = true;
				}
			}
		
			// Iterate through masks and swap if a stereo pair has been detected
			var masks = layers[i].Masks;
			if (masks != null)
			{
				for (var j = 2; j <= masks.numProperties; ++j)
				{
					var oldMask = masks.property(j - 1);
					var currentMask = masks.property(j);

					var stereoPair = converterCheckIfStereoPair(oldMask.name, currentMask.name);
					if (stereoPair > 0)
					{
						if (stereoPair == 2)
						{
							oldMask = masks.property(j);
							currentMask = masks.property(j - 1);
						}
						
						/*currentMask.name = oldMask.name;
						oldMask.name = "STEREO: not used in this comp";*/ //causes crashes... has to be done after this pass.

						currentMask.maskMode = oldMask.maskMode;
						oldMask.maskMode = MaskMode.NONE;
						
						currentMask.property(2).expression = "mask(" + j + ")(2)";
						currentMask.property(3).expression = "mask(" + j + ")(3)";
						currentMask.property(4).expression = "mask(" + j + ")(4)";
						
						oldMask.moveTo(j - (stereoPair == 1 ? 0 : 1));
						
						converterUpdateMaskIndexProperties(layers[i].Effects, stereoPair == 1 ? -1 : 1);
					}
					else
					{
						var oldMaskName = oldMask.name.toUpperCase();
						if (oldMaskName.length > 5 && oldMaskName.indexOf(".LEFT") == oldMaskName.length - 5)
							oldMask.maskMode = MaskMode.NONE;
						else if (oldMaskName.length > 6 && oldMaskName.indexOf(".RIGHT") == oldMaskName.length - 6)
							oldMask.maskMode = MaskMode.ADD;
					}
				}
				if (masks.numProperties > 0)
				{
					var maskName = masks.property(masks.numProperties).name.toUpperCase();
					if (maskName.length > 5 && maskName.indexOf(".LEFT") == maskName.length - 5)
						masks.property(masks.numProperties).maskMode = MaskMode.NONE;
					else if (maskName.length > 6 && maskName.indexOf(".RIGHT") == maskName.length - 6)
						masks.property(masks.numProperties).maskMode = MaskMode.ADD;
				}
			
				for (var j = 2; j <= masks.numProperties; ++j)
				{
					var oldMask = masks.property(j - 1);
					var currentMask = masks.property(j);

					var stereoPair = converterCheckIfStereoPair(oldMask.name, currentMask.name);
					if (stereoPair > 0)
					{
						if (stereoPair == 2)
						{
							oldMask = masks.property(j);
							currentMask = masks.property(j - 1);
						}
						
						currentMask.name = oldMask.name;
						oldMask.name = "STEREO: not used in this comp";
					}
				}
			}	
			
			// If the layer is a camera and not part of a stereo pair, create an expression offsetting it to the right
			// To account correctly for every possible position/orientation, this calculation is done via quaternion math
			if (layers[i] instanceof CameraLayer && (i == layers.length || layers[i + 1].name != "STEREO: not used in this comp"))
			{
				var camExpression = "rotY = -degreesToRadians(" + layerPath + ".transform.yRotation + " + layerPath + ".transform.orientation[1] + 90);\n";
				camExpression += "rotZ = degreesToRadians(" + layerPath + ".transform.zRotation + " + layerPath + ".transform.orientation[2]);\n\n";
				camExpression += "cosY = Math.cos(rotY);\n";
				camExpression += "sinY = Math.sin(rotY);\n\n";
				camExpression += "cosZ = Math.cos(rotZ);\n";
				camExpression += "sinZ = Math.sin(rotZ);\n\n";
				camExpression += "up = [0, -1, 0];\n\n";
				if (layers[i].autoOrient == AutoOrientType.CAMERA_OR_POINT_OF_INTEREST)
					camExpression += "forward = normalize((" + layerPath + ".transform.pointOfInterest - " + layerPath + ".transform.position));\n";
				else if (layers[i].autoOrient == AutoOrientType.NO_AUTO_ORIENT)
					camExpression += "forward = [0, 0, 1];\n";
				else // Reconstruct forward vector
				{
					layers[i].autoOrient = AutoOrientType.NO_AUTO_ORIENT;
					var forwardExpr;
					forwardExpr = "forward = " + layerPath + ".transform.position.valueAtTime(time + thisComp.frameDuration) -  " + layerPath + ".transform.position;\n";
					if (leftComp.layers[i].position.expressionEnabled)
						forwardExpr += "if (length(forward) < 0.0001) forward = [0, 0, 1];\n";	// when an expression is enabled on the position, auto-orientation doesn't interpolate motion	
					else
					{
						forwardExpr += "if (length(forward) < 0.0001) forward = " + layerPath + ".transform.position.valueAtTime(time + thisComp.frameDuration) -  " + layerPath + ".transform.position.loopIn(\"continue\");";
						forwardExpr += "if (length(forward) < 0.0001) forward = -(" + layerPath + ".transform.position.valueAtTime(time + thisComp.frameDuration) -  " + layerPath + ".transform.position.loopOut(\"continue\"));";
					}
					forwardExpr += "forward = normalize(forward);\n";

					layers[i].orientation.expression = forwardExpr;
					layers[i].orientation.expression += "lookAt([0, 0, 0], forward) + " + layerPath + ".transform.orientation;";
					layers[i].orientation.expressionEnabled = true;
					camExpression += forwardExpr;
					/*if (leftComp.layers[i].position.expressionEnabled == false)
					{
						try
						{
							if (leftComp.layers[i].position.expression == "")
								leftComp.layers[i].position.expression = "transform.position";
							leftComp.layers[i].position.expressionEnabled = true;
							alert("In the right comp, the camera's position expression has been set. This will prevent auto-orientation from working when not moving. To achieve the same results in both comps, the position expression in this comp has also been set.\
							Please assure that the camera is never standing perfectly still, otherwise the orientation will revert to its default value.");
						}
						catch (e) {}
					}*/
				}
				camExpression += "right = normalize(cross(forward, up));\n";
				camExpression += "up = normalize(cross(right, forward));\n\n";
				camExpression += "newUp = mul(up, cosZ) + mul(forward, mul(dot(forward, up), (1 - cosZ))) + mul(cross(forward, up), sinZ);\n\n";
				camExpression += "newRight = mul(forward, cosY) + mul(newUp, mul(dot(newUp, forward), (1 - cosY))) + mul(cross(newUp, forward), sinY);\n\n";
				
				layers[i].transform.position.expression =  camExpression + layerPath + ".transform.position " + " + comp(\"" + leftComp.name + "\").layer(\"Stereo Controls\").effect(\"Camera Separation\")(\"ADBE Slider Control-0001\") * newRight;";
				if (layers[i].autoOrient == AutoOrientType.CAMERA_OR_POINT_OF_INTEREST)
					layers[i].transform.pointOfInterest.expression = camExpression + layerPath + ".transform.pointOfInterest " + " + comp(\"" + leftComp.name + "\").layer(\"Stereo Controls\").effect(\"Camera Separation\")(\"ADBE Slider Control-0001\") * newRight;";
			}
		}

		// Iterate through layers and swap if a stereo pair has been detected
		layers = comp.layers;
		for (var i = 2; i <= layers.length; ++i)
		{
			var oldLayer = layers[i - 1];
			var currentLayer = layers[i];

			var stereoPair = converterCheckIfStereoPair(oldLayer.name, currentLayer.name);
			if (stereoPair > 0)
			{
				if (stereoPair == 2)
				{
					oldLayer = layers[i];
					currentLayer = layers[i - 1];	
				}
				currentLayer.name = oldLayer.name;
				oldLayer.name = "STEREO: not used in this comp";
				
				var oldLocked = false;
				if (oldLayer.locked)
				{
					oldLocked = true;
					oldLayer.locked = false;
				}
				var currentLocked = false;
				if (currentLayer.locked)
				{
					currentLocked = true;
					currentLocked.locked = false;
				}
			
				currentLayer.enabled = oldLayer.enabled;
				oldLayer.enabled = false;
				currentLayer.shy = oldLayer.shy;
				oldLayer.shy = true;
				
				if (stereoPair == 1)
					oldLayer.moveAfter(currentLayer);
				else
					oldLayer.moveBefore(currentLayer);
				
				if (oldLocked)
					oldLayer.locked = true;
				if (currentLocked)
					currentLayer.locked = true;
			}
			else
			{
				var oldLayerName = oldLayer.name.toUpperCase();
				if (oldLayerName.length > 5 && oldLayerName.indexOf(".LEFT") == oldLayerName.length - 5)
					oldLayer.enabled = false;
				else if (oldLayerName.length > 6 && oldLayerName.indexOf(".RIGHT") == oldLayerName.length - 6)
					oldLayer.enabled = true;
			}
		}
		if (layers.length > 0)
		{
			var layerName  = layers[layers.length].name.toUpperCase();
			if (layerName.length > 5 && layerName.indexOf(".LEFT") == layerName.length - 5)
				layers[layers.length].enabled = false;
			else if (layerName.length > 6 && layerName.indexOf(".RIGHT") == layerName.length - 6)
				layers[layers.length].enabled = true;		
		}
		
		 // Update layer index properties
		layers = comp.layers;
		for (var i = 1; i <= layers.length; ++i)
		{
			converterUpdateLayerIndexProperties(layers[i], leftComp.layers[i]);
		}
	
		 // Restore solo states
		layers = comp.layers;
		for (var i = 1; i <= layers.length; ++i)
		{
			layers[i].enabled = leftComp.layers[i].enabled;
			if (layers[i].enabled)
				layers[i].solo = leftComp.layers[i].solo;
		}
	}
	catch (e)
	{
		alert("Error - Script aborted\n\n" + "Error name: " + e.name + "\nError message: " + e.message);
	}
}

// -----------------------------------------------------------------------------------------------------------------------------

converterPanel = converterCreateUI(this);
if (converterPanel instanceof Window)
{
	converterPanel.center();
	converterPanel.show();
}
else
	converterPanel.layout.layout(true);