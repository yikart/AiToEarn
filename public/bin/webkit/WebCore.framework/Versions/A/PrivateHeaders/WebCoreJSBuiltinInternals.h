/*
 * Copyright (c) 2007, 2022 -2022 Apple Inc.  All rights reserved.
 * Copyright (c) 2015 Igalia
 * Copyright (c) 2015 Igalia S.L.
 * Copyright (c) 2015 Igalia.
 * Copyright (c) 2015, 2016 Canon Inc. All rights reserved.
 * Copyright (c) 2015, 2016, 2017 Canon Inc.
 * Copyright (c) 2016, 2020, 2022 Apple Inc. All rights reserved.
 * Copyright (c) 2017 Apple Inc.
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
 * 
 */

// DO NOT EDIT THIS FILE. It is automatically generated from JavaScript files for
// builtins by the script: Source/JavaScriptCore/Scripts/generate-js-builtins.py

#pragma once

#include "CommandLineAPIModuleSourceBuiltins.h"
#include "JSDOMBindingInternalsBuiltins.h"
#include "ReadableByteStreamInternalsBuiltins.h"
#include "ReadableStreamInternalsBuiltins.h"
#include "StreamInternalsBuiltins.h"
#include "TransformStreamInternalsBuiltins.h"
#include "WritableStreamInternalsBuiltins.h"
#include <JavaScriptCore/VM.h>
#include <JavaScriptCore/WeakInlines.h>

namespace WebCore {

class JSDOMGlobalObject;

class JSBuiltinInternalFunctions {
public:
    explicit JSBuiltinInternalFunctions(JSC::VM&);

    template<typename Visitor> void visit(Visitor&);
    void initialize(JSDOMGlobalObject&);

    ReadableByteStreamInternalsBuiltinFunctions& readableByteStreamInternals() { return m_readableByteStreamInternals; }
    ReadableStreamInternalsBuiltinFunctions& readableStreamInternals() { return m_readableStreamInternals; }
    StreamInternalsBuiltinFunctions& streamInternals() { return m_streamInternals; }
    TransformStreamInternalsBuiltinFunctions& transformStreamInternals() { return m_transformStreamInternals; }
    WritableStreamInternalsBuiltinFunctions& writableStreamInternals() { return m_writableStreamInternals; }
    JSDOMBindingInternalsBuiltinFunctions& jsDOMBindingInternals() { return m_jsDOMBindingInternals; }
    CommandLineAPIModuleSourceBuiltinFunctions& commandLineAPIModuleSource() { return m_commandLineAPIModuleSource; }

private:
    JSC::VM& m_vm;
    ReadableByteStreamInternalsBuiltinFunctions m_readableByteStreamInternals;
    ReadableStreamInternalsBuiltinFunctions m_readableStreamInternals;
    StreamInternalsBuiltinFunctions m_streamInternals;
    TransformStreamInternalsBuiltinFunctions m_transformStreamInternals;
    WritableStreamInternalsBuiltinFunctions m_writableStreamInternals;
    JSDOMBindingInternalsBuiltinFunctions m_jsDOMBindingInternals;
    CommandLineAPIModuleSourceBuiltinFunctions m_commandLineAPIModuleSource;
};

} // namespace WebCore
