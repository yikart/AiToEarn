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

WI.RecordingActionTreeElement = class RecordingActionTreeElement extends WI.GeneralTreeElement
{
    constructor(representedObject, index, recordingType)
    {
        console.assert(representedObject instanceof WI.RecordingAction);

        let titleFragment = WI.RecordingActionTreeElement._generateDOM(representedObject, recordingType);
        let classNames = WI.RecordingActionTreeElement._getClassNames(representedObject);

        const subtitle = null;
        super(classNames, titleFragment, subtitle, representedObject);

        this._index = index;

        if (this.representedObject.valid)
            this.representedObject.singleFireEventListener(WI.RecordingAction.Event.ValidityChanged, this._handleValidityChanged, this);
    }

    // Static

    static _generateDOM(recordingAction, recordingType)
    {
        let parameterCount = recordingAction.parameters.length;

        function createParameterElement(parameter, swizzleType, index) {
            let parameterElement = document.createElement("span");
            parameterElement.classList.add("parameter");

            switch (swizzleType) {
            case WI.Recording.Swizzle.Number:
                var constantNameForParameter = WI.RecordingAction.constantNameForParameter(recordingType, recordingAction.name, parameter, index, parameterCount);
                var bitfieldNamesForParameter = WI.RecordingAction.bitfieldNamesForParameter(recordingType, recordingAction.name, parameter, index, parameterCount);
                if (constantNameForParameter) {
                    parameterElement.classList.add("constant");
                    parameterElement.textContent = "context." + constantNameForParameter;
                } else if (bitfieldNamesForParameter) {
                    parameterElement.classList.add("constant");
                    parameterElement.textContent = bitfieldNamesForParameter.map((p) => p.startsWith("0x") ? p : "context." + p).join(" | ");
                } else
                    parameterElement.textContent = parameter.maxDecimals(2);
                break;

            case WI.Recording.Swizzle.Boolean:
                parameterElement.textContent = parameter;
                break;

            case WI.Recording.Swizzle.String:
                parameterElement.textContent = JSON.stringify(parameter);
                break;

            case WI.Recording.Swizzle.Array:
                parameterElement.classList.add("swizzled");
                parameterElement.textContent = JSON.stringify(parameter);
                break;

            case WI.Recording.Swizzle.TypedArray:
            case WI.Recording.Swizzle.Image:
            case WI.Recording.Swizzle.ImageBitmap:
            case WI.Recording.Swizzle.ImageData:
            case WI.Recording.Swizzle.DOMMatrix:
            case WI.Recording.Swizzle.Path2D:
            case WI.Recording.Swizzle.CanvasGradient:
            case WI.Recording.Swizzle.CanvasPattern:
                    parameterElement.classList.add("swizzled");
                    parameterElement.textContent = WI.Recording.displayNameForSwizzleType(swizzleType);
                    break;

            case WI.Recording.Swizzle.WebGLBuffer:
            case WI.Recording.Swizzle.WebGLFramebuffer:
            case WI.Recording.Swizzle.WebGLRenderbuffer:
            case WI.Recording.Swizzle.WebGLTexture:
            case WI.Recording.Swizzle.WebGLShader:
            case WI.Recording.Swizzle.WebGLProgram:
            case WI.Recording.Swizzle.WebGLUniformLocation:
            case WI.Recording.Swizzle.WebGLQuery:
            case WI.Recording.Swizzle.WebGLSampler:
            case WI.Recording.Swizzle.WebGLSync:
            case WI.Recording.Swizzle.WebGLTransformFeedback:
            case WI.Recording.Swizzle.WebGLVertexArrayObject: {
                let parameterTypeText = WI.Recording.displayNameForSwizzleType(swizzleType);
                if (!isNaN(parameter)) {
                    parameterElement.classList.add("object-handle");
                    parameterElement.textContent = `${parameterTypeText}${parameter + 1}`;
                } else {
                    parameterElement.classList.add("swizzled");
                    parameterElement.textContent = parameterTypeText;
                }
                break;
            }
            }

            if (!parameterElement.textContent) {
                parameterElement.classList.add("invalid");
                parameterElement.textContent = swizzleType === WI.Recording.Swizzle.None ? parameter : WI.Recording.displayNameForSwizzleType(swizzleType);
            }

            return parameterElement;
        }

        let titleFragment = document.createDocumentFragment();

        let contextReplacer = recordingAction.contextReplacer;
        if (contextReplacer) {
            let contextReplacerContainer = titleFragment.appendChild(document.createElement("span"));
            contextReplacerContainer.classList.add("context-replacer");
            contextReplacerContainer.textContent = contextReplacer;

            titleFragment.appendChild(document.createTextNode("."));
        }

        let nameContainer = titleFragment.appendChild(document.createElement("span"));
        nameContainer.classList.add("name");
        nameContainer.textContent = recordingAction.name;

        if (!parameterCount)
            return titleFragment;

        titleFragment.appendChild(document.createTextNode(recordingAction.isFunction ? "(" : " = "));

        let parametersContainer = titleFragment.appendChild(document.createElement("span"));
        parametersContainer.classList.add("parameters");

        for (let i = 0; i < parameterCount; ++i) {
            let parameter = recordingAction.parameters[i];
            let swizzleType = recordingAction.swizzleTypes[i];

            if (i)
                parametersContainer.appendChild(document.createTextNode(", "));

            let parameterElement = createParameterElement(parameter, swizzleType, i);
            parametersContainer.appendChild(parameterElement);
        }

        if (recordingAction.isFunction)
            titleFragment.appendChild(document.createTextNode(")"));

        let colorParameters = recordingAction.getColorParameters();
        if (colorParameters.length) {
            let swatch = WI.RecordingActionTreeElement._createSwatchForColorParameters(colorParameters);
            if (swatch) {
                let insertionIndex = recordingAction.parameters.indexOf(colorParameters[0]);
                parametersContainer.insertBefore(swatch.element, parametersContainer.children[insertionIndex]);
            }
        }

        let imageParameters = recordingAction.getImageParameters();
        let isImage = imageParameters[0] instanceof HTMLImageElement;
        let isImageBitmap = imageParameters[0] instanceof ImageBitmap;
        let isImageData = imageParameters[0] instanceof ImageData;
        let isCanvasGradient = imageParameters[0] instanceof CanvasGradient;
        let isCanvasPattern = imageParameters[0] instanceof CanvasPattern;
        if (imageParameters.length && (isImage || isImageBitmap || isImageData || isCanvasGradient || isCanvasPattern)) {
            let image = imageParameters[0];

            if (isImageBitmap)
                image = WI.ImageUtilities.imageFromImageBitmap(image);
            else if (isImageData)
                image = WI.ImageUtilities.imageFromImageData(image);
            else if (isCanvasGradient)
                image = WI.ImageUtilities.imageFromCanvasGradient(image, 100, 100);
            else if (isCanvasPattern)
                image = image.__image;

            if (image) {
                let swatch = new WI.InlineSwatch(WI.InlineSwatch.Type.Image, image);
                let insertionIndex = recordingAction.parameters.indexOf(imageParameters[0]);
                let parameterElement = parametersContainer.children[insertionIndex];
                parametersContainer.insertBefore(swatch.element, parameterElement);
            }
        }

        return titleFragment;
    }

    static _createSwatchForColorParameters(parameters)
    {
        let rgb = [];
        let color = null;

        switch (parameters.length) {
        case 1:
        case 2:
            if (typeof parameters[0] === "string")
                color = WI.Color.fromString(parameters[0].trim());
            else if (!isNaN(parameters[0]))
                rgb = WI.Color.normalized2rgb(parameters[0], parameters[0], parameters[0]);
            break;

        case 4:
            rgb = WI.Color.normalized2rgb(parameters[0], parameters[1], parameters[2]);
            break;

        case 5:
            rgb = WI.Color.cmyk2rgb(...parameters);
            break;

        default:
            console.error("Unexpected number of color parameters.");
            return null;
        }

        if (!color) {
            if (rgb.length !== 3)
                return null;

            let alpha = parameters.length === 1 ? 1 : parameters.lastValue;
            color = new WI.Color(WI.Color.Format.RGBA, [...rgb, alpha]);
            if (!color)
                return null;
        }

        return new WI.InlineSwatch(WI.InlineSwatch.Type.Color, color, {readOnly: true});
    }

    static _getClassNames(recordingAction)
    {
        let classNames = ["recording-action"];

        if (recordingAction instanceof WI.RecordingInitialStateAction) {
            classNames.push("initial-state");
            return classNames;
        }

        if (!recordingAction.isFunction)
            classNames.push("attribute");

        let actionClassName = WI.RecordingActionTreeElement._classNameForAction(recordingAction);
        if (actionClassName.length)
            classNames.push(actionClassName);

        if (recordingAction.isVisual)
            classNames.push("visual");

        if (!recordingAction.valid)
            classNames.push("invalid");

        return classNames;
    }

    static _classNameForAction(recordingAction)
    {
        if (recordingAction.contextReplacer)
            return "has-context-replacer";

        switch (recordingAction.name) {
        case "arc":
        case "arcTo":
            return "arc";

        case "globalAlpha":
        case "globalCompositeOperation":
        case "setAlpha":
        case "setGlobalAlpha":
        case "setCompositeOperation":
        case "setGlobalCompositeOperation":
            return "composite";

        case "bezierCurveTo":
        case "quadraticCurveTo":
            return "curve";

        case "clearRect":
        case "fill":
        case "fillRect":
        case "fillText":
            return "fill";

        case "createImageData":
        case "drawFocusIfNeeded":
        case "drawImage":
        case "drawImageFromRect":
        case "filter":
        case "getImageData":
        case "imageSmoothingEnabled":
        case "imageSmoothingQuality":
        case "putImageData":
        case "transferFromImageBitmap":
        case "webkitImageSmoothingEnabled":
            return "image";

        case "getLineDash":
        case "lineCap":
        case "lineDashOffset":
        case "lineJoin":
        case "lineWidth":
        case "miterLimit":
        case "setLineCap":
        case "setLineDash":
        case "setLineJoin":
        case "setLineWidth":
        case "setMiterLimit":
        case "webkitLineDash":
        case "webkitLineDashOffset":
            return "line-style";

        case "closePath":
        case "lineTo":
            return "line-to";

        case "beginPath":
        case "moveTo":
            return "move-to";

        case "isPointInPath":
            return "point-in-path";

        case "isPointInStroke":
            return "point-in-stroke";

        case "clearShadow":
        case "setShadow":
        case "shadowBlur":
        case "shadowColor":
        case "shadowOffsetX":
        case "shadowOffsetY":
            return "shadow";

        case "createConicGradient":
        case "createLinearGradient":
        case "createPattern":
        case "createRadialGradient":
        case "fillStyle":
        case "setFillColor":
        case "setStrokeColor":
        case "strokeStyle":
            return "style";

        case "stroke":
        case "strokeRect":
        case "strokeText":
            return "stroke";

        case "direction":
        case "font":
        case "measureText":
        case "textAlign":
        case "textBaseline":
            return "text";

        case "getTransform":
        case "resetTransform":
        case "rotate":
        case "scale":
        case "setTransform":
        case "transform":
        case "translate":
            return "transform";

        case "clip":
        case "ellipse":
        case "rect":
        case "restore":
        case "save":
            return recordingAction.name;
        }

        return "name-unknown";
    }

    // Public

    get index() { return this._index; }

    get filterableData()
    {
        let text = [];

        function getText(stringOrElement) {
            if (typeof stringOrElement === "string")
                text.push(stringOrElement);
            else if (stringOrElement instanceof Node)
                text.push(stringOrElement.textContent);
        }

        getText(this._mainTitleElement || this._mainTitle);
        getText(this._subtitleElement || this._subtitle);

        return {text};
    }

    // Protected

    onattach()
    {
        super.onattach();

        this.element.dataset.index = this._index.toLocaleString();

        if (this.representedObject.valid && this.representedObject.warning) {
            this.addClassName("warning");
            this.status = WI.ImageUtilities.useSVGSymbol("Images/Warning.svg", "warning", this.representedObject.warning);
        }
    }

    populateContextMenu(contextMenu, event)
    {
        contextMenu.appendItem(WI.UIString("Copy Action"), () => {
            InspectorFrontendHost.copyText(`context.${this.mainTitle};`);
        });

        contextMenu.appendSeparator();

        let sourceCodeLocation = this.representedObject.stackTrace?.firstNonNativeNonAnonymousNotBlackboxedCallFrame;
        if (sourceCodeLocation) {
            contextMenu.appendItem(WI.UIString("Reveal in Sources Tab"), () => {
                WI.showSourceCodeLocation(sourceCodeLocation, {
                    ignoreNetworkTab: true,
                    ignoreSearchTab: true,
                    initiatorHint: WI.TabBrowser.TabNavigationInitiator.ContextMenu,
                });
            });

            contextMenu.appendSeparator();
        }

        super.populateContextMenu(contextMenu, event);
    }

    // Private

    _handleValidityChanged(event)
    {
        this.addClassName("invalid");
    }
};
