/*
 * Copyright (C) 2014 Apple Inc. All rights reserved.
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

#include "UserContentProvider.h"
#include "UserScriptTypes.h"
#include "UserStyleSheetTypes.h"

namespace WebCore {

class UserContentController final : public UserContentProvider {
public:
    WEBCORE_EXPORT static Ref<UserContentController> create();
    WEBCORE_EXPORT ~UserContentController();

    WEBCORE_EXPORT void addUserScript(DOMWrapperWorld&, std::unique_ptr<UserScript>);
    WEBCORE_EXPORT void removeUserScript(DOMWrapperWorld&, const URL&);
    WEBCORE_EXPORT void removeUserScripts(DOMWrapperWorld&);

    WEBCORE_EXPORT void addUserStyleSheet(DOMWrapperWorld&, std::unique_ptr<UserStyleSheet>, UserStyleInjectionTime);
    WEBCORE_EXPORT void removeUserStyleSheet(DOMWrapperWorld&, const URL&);
    WEBCORE_EXPORT void removeUserStyleSheets(DOMWrapperWorld&);

    WEBCORE_EXPORT void removeAllUserContent();

private:
    UserContentController();

    // UserContentProvider
    void forEachUserScript(Function<void(DOMWrapperWorld&, const UserScript&)>&&) const final;
    void forEachUserStyleSheet(Function<void(const UserStyleSheet&)>&&) const final;
#if ENABLE(USER_MESSAGE_HANDLERS)
    void forEachUserMessageHandler(Function<void(const UserMessageHandlerDescriptor&)>&&) const final;
#endif
#if ENABLE(CONTENT_EXTENSIONS)
    ContentExtensions::ContentExtensionsBackend& userContentExtensionBackend() override { return m_contentExtensionBackend; }
#endif

    UserScriptMap m_userScripts;
    UserStyleSheetMap m_userStyleSheets;
#if ENABLE(CONTENT_EXTENSIONS)
    ContentExtensions::ContentExtensionsBackend m_contentExtensionBackend;
#endif
};

} // namespace WebCore
