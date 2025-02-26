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

WI.ShaderProgram = class ShaderProgram extends WI.Object
{
    constructor(target, identifier, programType, canvas, {sharesVertexFragmentShader} = {})
    {
        console.assert(target instanceof WI.Target, target);
        console.assert(target === canvas.target, target, canvas.target);
        console.assert(identifier);
        console.assert(Object.values(ShaderProgram.ProgramType).includes(programType));
        console.assert(canvas instanceof WI.Canvas);
        console.assert(ShaderProgram.contextTypeSupportsProgramType(canvas.contextType, programType));

        super();

        this._target = target;
        this._identifier = identifier;
        this._programType = programType;
        this._canvas = canvas;

        this._sharesVertexFragmentShader = !!sharesVertexFragmentShader;
        console.assert(!this._sharesVertexFragmentShader || (this._canvas.contextType === WI.Canvas.ContextType.WebGPU && this._programType === ShaderProgram.ProgramType.Render));

        this._disabled = false;
    }

    // Static

    static contextTypeSupportsProgramType(contextType, programType)
    {
        switch (contextType) {
        case WI.Canvas.ContextType.WebGL:
        case WI.Canvas.ContextType.OffscreenWebGL:
        case WI.Canvas.ContextType.WebGL2:
        case WI.Canvas.ContextType.OffscreenWebGL2:
            return programType === ShaderProgram.ProgramType.Render;

        case WI.Canvas.ContextType.WebGPU:
            return programType === ShaderProgram.ProgramType.Compute
                || programType === ShaderProgram.ProgramType.Render;
        }

        console.assert();
        return false;
    }

    static programTypeSupportsShaderType(programType, shaderType)
    {
        switch (programType) {
        case ShaderProgram.ProgramType.Compute:
            return shaderType === ShaderProgram.ShaderType.Compute;

        case ShaderProgram.ProgramType.Render:
            return shaderType === ShaderProgram.ShaderType.Fragment
                || shaderType === ShaderProgram.ShaderType.Vertex;
        }

        console.assert();
        return false;
    }

    // Public

    get target() { return this._target; }
    get identifier() { return this._identifier; }
    get programType() { return this._programType; }
    get canvas() { return this._canvas; }
    get sharesVertexFragmentShader() { return this._sharesVertexFragmentShader; }

    get displayName()
    {
        let format = null;
        switch (this._canvas.contextType) {
        case WI.Canvas.ContextType.WebGL:
        case WI.Canvas.ContextType.OffscreenWebGL:
        case WI.Canvas.ContextType.WebGL2:
        case WI.Canvas.ContextType.OffscreenWebGL2:
            format = WI.UIString("Program %d");
            break;
        case WI.Canvas.ContextType.WebGPU:
            switch (this._programType) {
            case ShaderProgram.ProgramType.Compute:
                format = WI.UIString("Compute Pipeline %d");
                break;
            case ShaderProgram.ProgramType.Render:
                format = WI.UIString("Render Pipeline %d");
                break;
            }
            break;
        }
        console.assert(format);
        if (!this._uniqueDisplayNumber)
            this._uniqueDisplayNumber = this._canvas.nextShaderProgramDisplayNumberForProgramType(this._programType);
        return format.format(this._uniqueDisplayNumber);
    }

    get disabled()
    {
        return this._disabled;
    }

    set disabled(disabled)
    {
        console.assert(this._programType === ShaderProgram.ProgramType.Render);
        console.assert(this._canvas.isWebGL || this._canvas.isWebGL2);

        if (this._canvas.contextType === WI.Canvas.ContextType.WebGPU)
            return;

        if (this._disabled === disabled)
            return;

        this._disabled = disabled;

        this._target.CanvasAgent.setShaderProgramDisabled(this._identifier, disabled);

        this.dispatchEventToListeners(ShaderProgram.Event.DisabledChanged);
    }

    requestShaderSource(shaderType, callback)
    {
        console.assert(Object.values(ShaderProgram.ShaderType).includes(shaderType));
        console.assert(ShaderProgram.programTypeSupportsShaderType(this._programType, shaderType));

        // COMPATIBILITY (iOS 13): `content` was renamed to `source`.
        this._target.CanvasAgent.requestShaderSource(this._identifier, shaderType, (error, source) => {
            if (error) {
                WI.reportInternalError(error);
                callback(null);
                return;
            }

            callback(source);
        });
    }

    updateShader(shaderType, source)
    {
        console.assert(Object.values(ShaderProgram.ShaderType).includes(shaderType));
        console.assert(ShaderProgram.programTypeSupportsShaderType(this._programType, shaderType));

        this._target.CanvasAgent.updateShader(this._identifier, shaderType, source);
    }

    showHighlight()
    {
        console.assert(this._programType === ShaderProgram.ProgramType.Render);
        console.assert(this._canvas.isWebGL || this._canvas.isWebGL2);

        this._target.CanvasAgent.setShaderProgramHighlighted(this._identifier, true);
    }

    hideHighlight()
    {
        console.assert(this._programType === ShaderProgram.ProgramType.Render);
        console.assert(this._canvas.isWebGL || this._canvas.isWebGL2);

        this._target.CanvasAgent.setShaderProgramHighlighted(this._identifier, false);
    }
};

WI.ShaderProgram.ProgramType = {
    Compute: "compute",
    Render: "render",
};

WI.ShaderProgram.ShaderType = {
    Compute: "compute",
    Fragment: "fragment",
    Vertex: "vertex",
};

WI.ShaderProgram.Event = {
    DisabledChanged: "shader-program-disabled-changed",
};
