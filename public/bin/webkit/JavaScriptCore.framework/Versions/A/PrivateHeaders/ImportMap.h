/*
 * Copyright (C) 2022 Apple Inc. All rights reserved.
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

#include <wtf/Expected.h>
#include <wtf/HashMap.h>
#include <wtf/URL.h>
#include <wtf/URLHash.h>
#include <wtf/Vector.h>

namespace JSC {

class SourceCode;

class ImportMap final : public RefCounted<ImportMap> {
public:
    using SpecifierMap = UncheckedKeyHashMap<String, URL>;
    struct ScopeEntry {
        URL m_scope;
        SpecifierMap m_map;
    };
    using Scopes = Vector<ScopeEntry>;
    using IntegrityMap = UncheckedKeyHashMap<URL, String>;

    class Reporter {
    public:
        virtual ~Reporter() = default;
        virtual void reportWarning(const String&) { };
    };

    static Ref<ImportMap> create() { return adoptRef(*new ImportMap()); }

    JS_EXPORT_PRIVATE URL resolve(const String& specifier, const URL& baseURL) const;
    JS_EXPORT_PRIVATE Expected<void, String> registerImportMap(const SourceCode&, const URL& baseURL, ImportMap::Reporter*);

    bool isAcquiringImportMaps() const { return m_isAcquiringImportMaps; }
    void setAcquiringImportMaps() { m_isAcquiringImportMaps = false; }

    JS_EXPORT_PRIVATE String integrityForURL(const URL&) const;

private:
    ImportMap() = default;

    static Expected<URL, String> resolveImportMatch(const String&, const URL&, const SpecifierMap&);

    SpecifierMap m_imports;
    Scopes m_scopes;
    IntegrityMap m_integrity;

    bool m_isAcquiringImportMaps : 1 { true };
};

} // namespace JSC
