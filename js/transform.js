// src/core/ui/transformpanel.js
// This module creates the "Transform" panel content.
// It is designed to be injected into the bottom editor bar by 'editorbar.js'.
// It listens for selection events and displays the Position, Rotation,
// and Scale of the selected object, providing controls to modify them.

let App; // Reference to the main App object
let panelContainer; // The <div> for this panel's content
let currentObject = null; // The currently selected THREE.Object3D

/**
 * Creates and injects the CSS styles for this panel.
 */
function injectStyles() {
    const styleId = 'transform-panel-ui-styles';
    if (document.getElementById(styleId)) return;

    const css = `
        /* The main container for this panel's content */
        #transform-panel-content {
            display: none; /* Hidden by default, shown by editorbar.js */
            height: 100%;
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
            padding: 8px; /* Standard padding */
            color: var(--workspace-text-color, #f5f5f7);
        }
        
        #transform-panel-content.is-active {
            display: block; /* The editorbar will set this */
        }

        /* Empty state text when no object is selected */
        .transform-empty-state {
            font-size: 14px;
            color: rgba(255,255,255,0.4);
            font-style: italic;
            text-align: center;
            padding-top: 20px;
        }

        /* This file uses the same .prop-group, .prop-header, etc. styles
         that are defined in 'propertiespanel.js'. This is efficient,
         as it re-uses the same "accordion" UI.
        */

        /* This is a placeholder for a future UI control */
        .prop-vector-control {
            padding: 4px 0 8px 0;
            font-size: 13px;
            line-height: 1.8;
            color: rgba(255,255,255,0.8);
        }
    `;

    const styleEl = document.createElement('style');
    styleEl.id = styleId;
    styleEl.textContent = css;
    document.head.appendChild(styleEl);
}

/**
 * Creates the HTML markup for the transform panel's shell.
 * It starts in an "empty" state.
 */
function createMarkup() {
    // This panel is injected into the .tools-content div created by editorbar.js
    const toolsContent = document.querySelector('.tools-content');
    if (!toolsContent) {
        console.error('TransformPanel: .tools-content not found!');
        return;
    }

    // Create the container
    panelContainer = document.createElement('div');
    panelContainer.id = 'transform-panel-content';
    // This panel is NOT active by default.
    // The 'editorbar.js' will toggle this class.
    panelContainer.className = ''; 

    // Start with the "empty" state
    clearPanelData();

    // Add this panel to the main tools content area
    toolsContent.appendChild(panelContainer);
}

/**
 * --- Renders the panel with the selected object's data ---
 * @param {THREE.Object3D} object - The object that was selected.
 */
function updatePanelData(object) {
    if (!object) return;
    currentObject = object;

    // --- 1. Get Data ---
    // We get the *real-time* data from the object.
    
    // Position
    const posX = object.position.x.toFixed(2);
    const posY = object.position.y.toFixed(2);
    const posZ = object.position.z.toFixed(2);
    
    // Rotation (in Radians, converted to Degrees for the UI)
    const rotX = THREE.MathUtils.radToDeg(object.rotation.x).toFixed(1);
    const rotY = THREE.MathUtils.radToDeg(object.rotation.y).toFixed(1);
    const rotZ = THREE.MathUtils.radToDeg(object.rotation.z).toFixed(1);
    
    // Scale
    const scaleX = object.scale.x.toFixed(2);
    const scaleY = object.scale.y.toFixed(2);
    const scaleZ = object.scale.z.toFixed(2);

    // --- 2. Build HTML ---
    // We re-use the `createProp` function (from propertiespanel.js)
    // and the `ARROW_ICON` (from gizmotools.js) which are in global scope
    // NOTE: This is fragile. A better way would be a shared 'UI' module.
    const createProp = window.createProp;
    const ARROW_ICON = window.ARROW_ICON;
    
    if (!createProp || !ARROW_ICON) {
        console.error('TransformPanel: Missing global UI functions!');
        return;
    }

    let html = '';
    
    // Create Position accordion item
    html += createProp('Position', `
        <div class="prop-vector-control" data-object-uuid="${object.uuid}" data-property="position">
            X: <span class="prop-text-value">${posX}</span><br>
            Y: <span class="prop-text-value">${posY}</span><br>
            Z: <span class="prop-text-value">${posZ}</span>
        </div>
    `, true); // Start open

    // Create Rotation accordion item
    html += createProp('Rotation', `
        <div class="prop-vector-control" data-object-uuid="${object.uuid}" data-property="rotation">
            X: <span class="prop-text-value">${rotX}</span>&deg;<br>
            Y: <span class="prop-text-value">${rotY}</span>&deg;<br>
            Z: <span class="prop-text-value">${rotZ}</span>&deg;
        </div>
    `, true); // Start open

    // Create Scale accordion item
    html += createProp('Scale', `
        <div class="prop-vector-control" data-object-uuid="${object.uuid}" data-property="scale">
            X: <span class="prop-text-value">${scaleX}</span><br>
            Y: <span class="prop-text-value">${scaleY}</span><br>
            Z: <span class="prop-text-value">${scaleZ}</span>
        </div>
    `, true); // Start open

    panelContainer.innerHTML = html;

    // --- 3. Re-attach Listeners ---
    // Add click listeners to all the accordion headers
    panelContainer.querySelectorAll('.prop-header').forEach(header => {
        header.addEventListener('click', () => {
            const group = header.closest('.prop-group');
            if (group) {
                group.classList.toggle('is-closed');
            }
        });
    });
    
    // --- 4. TODO: Initialize Vector Controls ---
    // In the future, we would call:
    // import { initVectorControls } from './controls/vector.js';
    // initVectorControls(panelContainer, App);
}

/**
 * --- Clears the panel and shows an empty state ---
 */
function clearPanelData() {
    currentObject = null;
    if (panelContainer) {
        panelContainer.innerHTML = `
            <div class="transform-empty-state">
                No object selected
            </div>
        `;
    }
}

/**
 * --- Public API to show this panel ---
 */
function showPanel() {
    if (panelContainer) panelContainer.classList.add('is-active');
}

/**
 * --- Public API to hide this panel ---
 */
function hidePanel() {
    if (panelContainer) panelContainer.classList.remove('is-active');
}

/**
 * --- NEW: Live-updates the transform values ---
 * This function is called every frame by the Gizmo during a drag.
 */
function updateValues() {
    if (!currentObject || !panelContainer) return;

    // This is "performant" (enough) because it only updates textContent,
    // it doesn't rebuild the entire innerHTML.
    
    // Find the control containers (we'll just update their text)
    const posControl = panelContainer.querySelector('[data-property="position"]');
    const rotControl = panelContainer.querySelector('[data-property="rotation"]');
    const scaleControl = panelContainer.querySelector('[data-property="scale"]');

    if (posControl) {
        posControl.innerHTML = `
            X: <span class="prop-text-value">${currentObject.position.x.toFixed(2)}</span><br>
            Y: <span class="prop-text-value">${currentObject.position.y.toFixed(2)}</span><br>
            Z: <span class="prop-text-value">${currentObject.position.z.toFixed(2)}</span>
        `;
    }
    
    if (rotControl) {
        rotControl.innerHTML = `
            X: <span class="prop-text-value">${THREE.MathUtils.radToDeg(currentObject.rotation.x).toFixed(1)}</span>&deg;<br>
            Y: <span class="prop-text-value">${THREE.MathUtils.radToDeg(currentObject.rotation.y).toFixed(1)}</span>&deg;<br>
            Z: <span class="prop-text-value">${THREE.MathUtils.radToDeg(currentObject.rotation.z).toFixed(1)}</span>&deg;
        `;
    }
    
    if (scaleControl) {
        scaleControl.innerHTML = `
            X: <span class="prop-text-value">${currentObject.scale.x.toFixed(2)}</span><br>
            Y: <span class="prop-text-value">${currentObject.scale.y.toFixed(2)}</span><br>
            Z: <span class="prop-text-value">${currentObject.scale.z.toFixed(2)}</span>
        `;
    }
}


/**
 * Initializes the Transform Panel module.
 * @param {object} app - The main App object.
 */
export function initTransformPanel(app) {
    App = app;

    injectStyles();
    // We delay createMarkup to make sure .tools-content exists
    // This is a common pattern to manage load order.
    setTimeout(createMarkup, 100); 

    // Attach the public API to the App object
    if (!App.transformPanel) App.transformPanel = {};
    App.transformPanel.show = showPanel;
    App.transformPanel.hide = hidePanel;
    App.transformPanel.updateValues = updateValues; // <-- NEW API function
    
    // --- Subscribe to events from other modules ---
    
    // Listen for when a new object is selected
    App.events.subscribe('selectionChanged', updatePanelData);
    
    // Listen for when the selection is cleared
    App.events.subscribe('selectionCleared', clearPanelData);

    console.log('Transform Panel Initialized.');
}
