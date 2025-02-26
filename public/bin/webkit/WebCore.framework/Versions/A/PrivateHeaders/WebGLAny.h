/*
 * Copyright (C) 2017-2023 Apple Inc. All rights reserved.
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
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. ``AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL APPLE INC. OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 * OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#if ENABLE(WEBGL)

#include <JavaScriptCore/Forward.h>

namespace JSC {
class CallFrame;
class JSValue;
}

namespace WebCore {

class JSDOMGlobalObject;
class WebGLBuffer;
class WebGLFramebuffer;
class WebGLProgram;
class WebGLQuery;
class WebGLRenderbuffer;
class WebGLSampler;
class WebGLTexture;
class WebGLTimerQueryEXT;
class WebGLTransformFeedback;
class WebGLVertexArrayObject;
class WebGLVertexArrayObjectOES;

using WebGLAny = std::variant<
    std::nullptr_t,
    bool,
    int,
    unsigned,
    long long,
    unsigned long long,
    float,
    String,
    Vector<bool>,
    Vector<int>,
    Vector<unsigned>,
    RefPtr<Float32Array>,
    RefPtr<Int32Array>,
    RefPtr<Uint32Array>,
    RefPtr<Uint8Array>,
    RefPtr<WebGLBuffer>,
    RefPtr<WebGLFramebuffer>,
    RefPtr<WebGLProgram>,
    RefPtr<WebGLQuery>,
    RefPtr<WebGLRenderbuffer>,
    RefPtr<WebGLSampler>,
    RefPtr<WebGLTexture>,
    RefPtr<WebGLTimerQueryEXT>,
    RefPtr<WebGLTransformFeedback>,
    RefPtr<WebGLVertexArrayObject>,
    RefPtr<WebGLVertexArrayObjectOES>
>;

} // namespace WebCore

#endif
