/*
 * Copyright (C) 2017 Apple Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. AND ITS CONTRIBUTORS ``AS IS''
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO,
 * THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL APPLE INC. OR ITS CONTRIBUTORS
 * BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF
 * THE POSSIBILITY OF SUCH DAMAGE.
 */

WI.ShaderProgramContentView = class ShaderProgramContentView extends WI.ContentView
{
    constructor(shaderProgram)
    {
        console.assert(shaderProgram instanceof WI.ShaderProgram);

        super(shaderProgram);

        let isWebGPU = this.representedObject.canvas.contextType === WI.Canvas.ContextType.WebGPU;
        let sharesVertexFragmentShader = isWebGPU && this.representedObject.sharesVertexFragmentShader;

        this._refreshButtonNavigationItem = new WI.ButtonNavigationItem("refresh", WI.UIString("Refresh"), "Images/ReloadFull.svg", 13, 13);
        this._refreshButtonNavigationItem.visibilityPriority = WI.NavigationItem.VisibilityPriority.Low;
        this._refreshButtonNavigationItem.addEventListener(WI.ButtonNavigationItem.Event.Clicked, this._refreshContent, this);

        let contentDidChangeDebouncer = new Debouncer((event) => {
            this._contentDidChange(event);
        });

        this.element.classList.add("shader-program", this.representedObject.programType);

        let createEditor = (shaderType) => {
            let container = this.element.appendChild(document.createElement("div"));

            let header = container.appendChild(document.createElement("header"));

            let shaderTypeContainer = header.appendChild(document.createElement("div"));
            shaderTypeContainer.classList.add("shader-type");

            let textEditor = new WI.TextEditor;
            textEditor.readOnly = false;
            textEditor.addEventListener(WI.TextEditor.Event.Focused, this._editorFocused, this);
            textEditor.addEventListener(WI.TextEditor.Event.NumberOfSearchResultsDidChange, this._numberOfSearchResultsDidChange, this);
            textEditor.addEventListener(WI.TextEditor.Event.ContentDidChange, function(event) {
                contentDidChangeDebouncer.delayForTime(250, event);
            }, textEditor);

            switch (shaderType) {
            case WI.ShaderProgram.ShaderType.Compute:
                shaderTypeContainer.textContent = WI.UIString("Compute Shader");
                textEditor.mimeType = isWebGPU ? "x-pipeline/x-compute" : "x-shader/x-compute";
                break;

            case WI.ShaderProgram.ShaderType.Fragment:
                shaderTypeContainer.textContent = WI.UIString("Fragment Shader");
                textEditor.mimeType = isWebGPU ? "x-pipeline/x-render" : "x-shader/x-fragment";
                break;

            case WI.ShaderProgram.ShaderType.Vertex:
                if (sharesVertexFragmentShader)
                    shaderTypeContainer.textContent = WI.UIString("Vertex/Fragment Shader");
                else
                    shaderTypeContainer.textContent = WI.UIString("Vertex Shader");
                textEditor.mimeType = isWebGPU ? "x-pipeline/x-render" : "x-shader/x-vertex";
                break;
            }

            this.addSubview(textEditor);
            container.appendChild(textEditor.element);
            container.classList.add("shader", shaderType);
            container.classList.toggle("shares-vertex-fragment-shader", sharesVertexFragmentShader);

            return textEditor;
        };

        switch (this.representedObject.programType) {
        case WI.ShaderProgram.ProgramType.Compute: {
            this._computeEditor = createEditor(WI.ShaderProgram.ShaderType.Compute);

            this._lastActiveEditor = this._computeEditor;
            break;
        }

        case WI.ShaderProgram.ProgramType.Render: {
            this._vertexEditor = createEditor(WI.ShaderProgram.ShaderType.Vertex);

            if (!sharesVertexFragmentShader) {
                this._fragmentEditor = createEditor(WI.ShaderProgram.ShaderType.Fragment);
            }

            this._lastActiveEditor = this._vertexEditor;
            break;
        }
        }

        if (WI.FileUtilities.canSave(WI.FileUtilities.SaveMode.FileVariants))
            this._saveMode = WI.FileUtilities.SaveMode.FileVariants;
        else if (WI.FileUtilities.canSave(WI.FileUtilities.SaveMode.SingleFile))
            this._saveMode = WI.FileUtilities.SaveMode.SingleFile;
        else
            this._saveMode = null;
    }

    // Public

    get navigationItems()
    {
        return [this._refreshButtonNavigationItem];
    }

    // Protected

    attached()
    {
        super.attached();

        this._refreshContent();
    }

    get supportsSave()
    {
        return !!this._saveMode;
    }

    get saveMode()
    {
        return this._saveMode;
    }

    get saveData()
    {
        let data = [];
        let addDataForEditor = (editor) => {
            if (!editor || (editor !== this._lastActiveEditor && this._saveMode === WI.FileUtilities.SaveMode.SingleFile))
                return;

            let filename = "";
            let displayType = "";
            switch (editor) {
            case this._computeEditor:
                filename = WI.UIString("Compute");
                displayType = WI.UIString("Compute Shader");
                break;
            case this._fragmentEditor:
                filename = WI.UIString("Fragment");
                displayType = WI.UIString("Fragment Shader");
                break;
            case this._vertexEditor:
                filename = WI.UIString("Vertex");
                displayType = WI.UIString("Vertex Shader");
                break;
            }
            console.assert(filename);
            console.assert(displayType);

            let extension = "";
            switch (this.representedObject.canvas.contextType) {
            case WI.Canvas.ContextType.WebGL:
            case WI.Canvas.ContextType.OffscreenWebGL:
            case WI.Canvas.ContextType.WebGL2:
            case WI.Canvas.ContextType.OffscreenWebGL2:
                extension = WI.unlocalizedString(".glsl");
                break;
            case WI.Canvas.ContextType.WebGPU:
                extension = WI.unlocalizedString(".wsl");
                break;
            }
            console.assert(extension);

            data.push({
                displayType,
                content: editor.string,
                suggestedName: filename + extension,
                forceSaveAs: true,
            });
        };
        addDataForEditor(this._computeEditor);
        addDataForEditor(this._fragmentEditor);
        addDataForEditor(this._vertexEditor);
        return data;
    }

    get supportsSearch()
    {
        return true;
    }

    get numberOfSearchResults()
    {
        return this._lastActiveEditor.numberOfSearchResults;
    }

    get hasPerformedSearch()
    {
        return this._lastActiveEditor.currentSearchQuery !== null;
    }

    set automaticallyRevealFirstSearchResult(reveal)
    {
        this._lastActiveEditor.automaticallyRevealFirstSearchResult = reveal;
    }

    performSearch(query)
    {
        this._lastActiveEditor.performSearch(query);
    }

    searchCleared()
    {
        this._lastActiveEditor.searchCleared();
    }

    searchQueryWithSelection()
    {
        return this._lastActiveEditor.searchQueryWithSelection();
    }

    revealPreviousSearchResult(changeFocus)
    {
        this._lastActiveEditor.revealPreviousSearchResult(changeFocus);
    }

    revealNextSearchResult(changeFocus)
    {
        this._lastActiveEditor.revealNextSearchResult(changeFocus);
    }

    revealPosition(position, options = {})
    {
        this._lastActiveEditor.revealPosition(position, options);
    }

    // Private

    _refreshContent()
    {
        let spinnerContainer = null;

        if (!this.didInitialLayout) {
            spinnerContainer = this.element.appendChild(document.createElement("div"));
            spinnerContainer.className = "spinner-container";
            spinnerContainer.appendChild((new WI.IndeterminateProgressSpinner).element);

            this._contentErrorMessageElement?.remove();
        }

        let createCallback = (textEditor) => {
            return (source) => {
                spinnerContainer?.remove();

                if (source === null) {
                    if (!this._contentErrorMessageElement) {
                        const isError = true;
                        this._contentErrorMessageElement = WI.createMessageTextView(WI.UIString("An error occurred trying to load the resource."), isError);
                    }
                    if (!this._contentErrorMessageElement.parentNode)
                        this.element.appendChild(this._contentErrorMessageElement);
                    return;
                }

                textEditor.string = source || "";
            };
        };

        switch (this.representedObject.programType) {
        case WI.ShaderProgram.ProgramType.Compute:
            this.representedObject.requestShaderSource(WI.ShaderProgram.ShaderType.Compute, createCallback(this._computeEditor));
            return;

        case WI.ShaderProgram.ProgramType.Render:
            this.representedObject.requestShaderSource(WI.ShaderProgram.ShaderType.Vertex, createCallback(this._vertexEditor));
            if (!this.representedObject.sharesVertexFragmentShader)
                this.representedObject.requestShaderSource(WI.ShaderProgram.ShaderType.Fragment, createCallback(this._fragmentEditor));
            return;
        }

        console.assert();
    }

    _updateShader(shaderType)
    {
        switch (shaderType) {
        case WI.ShaderProgram.ShaderType.Compute:
            this.representedObject.updateShader(shaderType, this._computeEditor.string);
            return;

        case WI.ShaderProgram.ShaderType.Fragment:
            this.representedObject.updateShader(shaderType, this._fragmentEditor.string);
            return;

        case WI.ShaderProgram.ShaderType.Vertex:
            this.representedObject.updateShader(shaderType, this._vertexEditor.string);
            return;
        }

        console.assert();
    }

    _editorFocused(event)
    {
        if (this._lastActiveEditor === event.target)
            return;

        let currentSearchQuery = null;

        if (this._lastActiveEditor) {
            currentSearchQuery = this._lastActiveEditor.currentSearchQuery;

            this._lastActiveEditor.searchCleared();
        }

        this._lastActiveEditor = event.target;

        if (currentSearchQuery)
            this._lastActiveEditor.performSearch(currentSearchQuery);
    }

    _numberOfSearchResultsDidChange(event)
    {
        this.dispatchEventToListeners(WI.ContentView.Event.NumberOfSearchResultsDidChange);
    }

    _contentDidChange(event)
    {
        switch (event.target) {
        case this._computeEditor:
            this._updateShader(WI.ShaderProgram.ShaderType.Compute);
            return;

        case this._fragmentEditor:
            this._updateShader(WI.ShaderProgram.ShaderType.Fragment);
            return;

        case this._vertexEditor:
            this._updateShader(WI.ShaderProgram.ShaderType.Vertex);
            return;
        }

        console.assert();
    }
};
