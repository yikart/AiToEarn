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

#include "DFABytecodeInterpreter.h"
#include "StyleSheetContents.h"
#include <wtf/Ref.h>
#include <wtf/RefCounted.h>
#include <wtf/RefPtr.h>

namespace WebCore {

namespace ContentExtensions {

class CompiledContentExtension;

class ContentExtension : public RefCounted<ContentExtension> {
public:
    enum class ShouldCompileCSS : bool { No, Yes };
    static Ref<ContentExtension> create(const String& identifier, Ref<CompiledContentExtension>&&, URL&&, ShouldCompileCSS);

    const String& identifier() const { return m_identifier; }
    const URL& extensionBaseURL() const { return m_extensionBaseURL; }
    const CompiledContentExtension& compiledExtension() const { return m_compiledExtension.get(); }
    StyleSheetContents* globalDisplayNoneStyleSheet();
    const DFABytecodeInterpreter::Actions& topURLActions(const URL& topURL) const;
    const DFABytecodeInterpreter::Actions& frameURLActions(const URL& frameURL) const;
    const Vector<uint64_t>& universalActions() const { return m_universalActions; }

private:
    ContentExtension(const String& identifier, Ref<CompiledContentExtension>&&, URL&&, ShouldCompileCSS);
    uint32_t findFirstIgnorePreviousRules() const;
    
    String m_identifier;
    Ref<CompiledContentExtension> m_compiledExtension;
    URL m_extensionBaseURL;

    RefPtr<StyleSheetContents> m_globalDisplayNoneStyleSheet;
    void compileGlobalDisplayNoneStyleSheet();

    void populateTopURLActionCacheIfNeeded(const URL& topURL) const;
    mutable URL m_cachedTopURL;
    mutable DFABytecodeInterpreter::Actions m_cachedTopURLActions;

    void populateFrameURLActionCacheIfNeeded(const URL& frameURL) const;
    mutable URL m_cachedFrameURL;
    mutable DFABytecodeInterpreter::Actions m_cachedFrameURLActions;

    Vector<uint64_t> m_universalActions;
};

} // namespace ContentExtensions
} // namespace WebCore

#endif // ENABLE(CONTENT_EXTENSIONS)
