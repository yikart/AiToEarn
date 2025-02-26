/*
 * Copyright (C) 2015 Apple Inc. All rights reserved.
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

#pragma once

#if ENABLE(CONTENT_EXTENSIONS)

#include "CompiledContentExtension.h"
#include <system_error>
#include <wtf/Forward.h>
#include <wtf/Ref.h>

namespace WebCore::ContentExtensions {

class ContentExtensionCompilationClient {
public:
    virtual ~ContentExtensionCompilationClient() = default;
    
    // Functions should be called in this order. All except writeActions and finalize can be called multiple times, though.
    virtual void writeSource(String&&) = 0;
    virtual void writeActions(Vector<SerializedActionByte>&&) = 0;
    virtual void writeURLFiltersBytecode(Vector<DFABytecode>&&) = 0;
    virtual void writeTopURLFiltersBytecode(Vector<DFABytecode>&&) = 0;
    virtual void writeFrameURLFiltersBytecode(Vector<DFABytecode>&&) = 0;
    virtual void finalize() = 0;
};

WEBCORE_EXPORT std::error_code compileRuleList(ContentExtensionCompilationClient&, String&& ruleJSON, Vector<ContentExtensionRule>&&);

} // namespace WebCore::ContentExtensions

#endif // ENABLE(CONTENT_EXTENSIONS)
