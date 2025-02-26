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

#pragma once

#if ENABLE(APPLICATION_MANIFEST)

#include "ApplicationManifest.h"
#include <optional>
#include <wtf/JSONValues.h>

namespace WebCore {

class Color;
class Document;

class ApplicationManifestParser {
public:
    WEBCORE_EXPORT static ApplicationManifest parse(Document&, const String&, const URL& manifestURL, const URL& documentURL);
    WEBCORE_EXPORT static ApplicationManifest parse(const String&, const URL& manifestURL, const URL& documentURL);
    WEBCORE_EXPORT static std::optional<ApplicationManifest> parseWithValidation(const String&, const URL& manifestURL, const URL& documentURL);

private:
    ApplicationManifestParser(RefPtr<Document>);
    ApplicationManifest parseManifest(const JSON::Object&, const String&, const URL&, const URL&);

    RefPtr<JSON::Object> createJSONObject(const String&);
    URL parseStartURL(const JSON::Object&, const URL&);
    ApplicationManifest::Direction parseDir(const JSON::Object&);
    ApplicationManifest::Display parseDisplay(const JSON::Object&);
    const std::optional<ScreenOrientationLockType> parseOrientation(const JSON::Object&);
    String parseName(const JSON::Object&);
    String parseDescription(const JSON::Object&);
    String parseShortName(const JSON::Object&);
    std::optional<URL> parseScope(const JSON::Object&, const URL&, const URL&);
    Vector<String> parseCategories(const JSON::Object&);
    Vector<ApplicationManifest::Icon> parseIcons(const JSON::Object&);
    Vector<ApplicationManifest::Shortcut> parseShortcuts(const JSON::Object&);
    URL parseId(const JSON::Object&, const URL&);

    Color parseColor(const JSON::Object&, const String& propertyName);
    String parseGenericString(const JSON::Object&, const String&);

    void logManifestPropertyNotAString(const String&);
    void logManifestPropertyInvalidURL(const String&);
    void logDeveloperWarning(const String& message);

    RefPtr<Document> m_document;
    URL m_manifestURL;
};

} // namespace WebCore

#endif // ENABLE(APPLICATION_MANIFEST)
