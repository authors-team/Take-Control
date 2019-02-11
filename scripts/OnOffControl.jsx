{
	// OnOffControl.jsx
	// Name: OnOff Control
	// Version: 1.0
	// Created with love by AUTHORS (http://authorsprojects.com)
	// Author: Chris Zachary
	//
	// Description:
	// This script creates a control layer with checkboxes to control the selected properties/layers
	// If a control layer with the provided layer already exists, it adds the control to the existing control layer.
	//
	//
	// Legal:
	// This work is licensed under the Creative Commons Attribution 4.0 International License.
	// To view a copy of this license, visit http://creativecommons.org/licenses/by/4.0/
	// or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
	//
	// This script is provided "as is," without warranty of any kind, expressed
	// or implied. In no event shall the author be held liable for any damages
	// arising in any way from the use of this script.
	//
	// TL;DR:
	// We want to share our code with you, but some of it is a work in progress,
	// so don't judge us if you run into a bug or two!
	//

	//

	function OnOffControl(thisObj) {
		var scriptName = "On/Off Control";
		var controlLayerName = "_CONTROL";

		//
		// This function is called when the user enters text for the control layer.
		//
		function onNameInputChange() {
			controlLayerName = this.text; // Set the control Layer Name based on the text
		}

		function createControls() {
			var activeItem = app.project.activeItem;
			if (activeItem == null || !(activeItem instanceof CompItem)) {
				alert("Please select or open a composition first.", scriptName);
			} else {
				//Get selected layers
				var selectedLayers = activeItem.selectedLayers;
				if (selectedLayers < 1) {
					alert(
						"Please select a Layer or Property to apply the control to.",
						scriptName
					);
				} else {
					//store selected props
					var selProps = new Array();
					for (var i = 0; i < selectedLayers.length; i++) {
						selProps[i] = selectedLayers[i].selectedProperties;
					}
					// Validate the input field, in case the user didn't defocus it first (which often can be the case).
					this.parent.parent.optsRow.name_input.notify("onChange");

					// Begin undo group
					app.beginUndoGroup(scriptName);

					// Check if control layer exists. If it doesn't create a new one
					if (activeItem.layer(controlLayerName) == null) {
						// Create control layer
						var controlLayer = activeItem.layers.addNull();
						controlLayer.name = controlLayerName;
						controlLayer.selected = false;
					} else {
						var controlLayer = activeItem.layer(controlLayerName);
					}

					// Loop through selected layers to find props
					for (var i = 0; i < selectedLayers.length; i++) {
						var curLayer = selectedLayers[i];

						// Get all selected props
						var selectedProps = selProps[i];
						var propsCount = 0;
						for (var k = 0; k < selectedProps.length; k++) {
							var prop = selectedProps[k];
							// Check if property is the correct type to apply effect to
							if (prop.propertyType == PropertyType.PROPERTY) {
								// Create checkbox
								var checkbox = controlLayer.Effects.addProperty(
									"ADBE Checkbox Control"
								);
								checkbox.name =
									curLayer.name + " - " + prop.name + " - Control";
								checkbox.property("Checkbox").setValue(1);

								// set expression
								prop.expression =
									'thisComp.layer("' +
									controlLayer.name +
									'").effect("' +
									checkbox.name +
									'")("Checkbox")*value';
								propsCount++;
							}
						}

						if (propsCount == 0) {
							// Didn't have property selected - apply effect to overall layer (opacity)

							// Create checkbox
							var checkbox = controlLayer.Effects.addProperty(
								"ADBE Checkbox Control"
							);
							checkbox.name = curLayer.name + " - Control";
							checkbox.property("Checkbox").setValue(1);

							// set expression
							curLayer.opacity.expression =
								'thisComp.layer("' +
								controlLayer.name +
								'").effect("' +
								checkbox.name +
								'")("Checkbox")*value';
							curLayer.selected = false;
						}
					}

					// Hide control layer and then set control layer as selected
					controlLayer.enabled = false;
					controlLayer.selected = true;

					// End undo group
					app.endUndoGroup();
				}
			}
		}

		//
		// This function asks the user whether they want to create a new Control layer or
		// use an existing one. It accepts a text input to find out what the existing control layer
		// is called. Click create and the script runs.
		//
		function BuildAndShowUI(thisObj) {
			// Create and show a floating palette.
			var my_palette =
				thisObj instanceof Panel
					? thisObj
					: new Window("palette", scriptName, undefined, { resizeable: true });
			if (my_palette != null) {
				var res =
					"group { \
						orientation:'column', alignment:['fill','top'], alignChildren:['left','top'], spacing:5, margins:[0,0,0,0], \
						optsRow: Group { \
							orientation:'column', alignment:['fill','top'], \
                            name_text: StaticText { text:'Control Layer Name:', alignment:['left','top'] },\
							name_input: EditText { text:'_CONTROL', alignment:['left','top'], preferredSize:[80,20] }, \
						}, \
						cmds: Group { \
							alignment:['fill','top'], \
							okButton: Button { text:'Take Control!', alignment:['fill','center'] }, \
						}, \
					}";

				my_palette.margins = [10, 10, 10, 10];
				my_palette.grp = my_palette.add(res);

				// Workaround to ensure the edittext text color is black, even at darker UI brightness levels.
				var winGfx = my_palette.graphics;
				var darkColorBrush = winGfx.newPen(
					winGfx.BrushType.SOLID_COLOR,
					[0, 0, 0],
					1
				);
				my_palette.grp.optsRow.name_input.graphics.foregroundColor = darkColorBrush;

				// Set the callback. When the user enters text, this will be called.
				my_palette.grp.optsRow.name_input.onChange = onNameInputChange;

				my_palette.grp.cmds.okButton.onClick = createControls;

				my_palette.onResizing = my_palette.onResize = function() {
					this.layout.resize();
				};
			}

			return my_palette;
		}

		//
		// The main script.
		//
		if (parseFloat(app.version) < 8) {
			alert("This script requires After Effects CS3 or later.", scriptName);
			return;
		}

		var my_palette = BuildAndShowUI(thisObj);
		if (my_palette != null) {
			if (my_palette instanceof Window) {
				my_palette.center();
				my_palette.show();
			} else {
				my_palette.layout.layout(true);
				my_palette.layout.resize();
			}
		} else {
			alert("Could not open the user interface.", scriptName);
		}
	}

	OnOffControl(this);
}
