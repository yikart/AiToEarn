/*
 * Copyright (C) 2015-2021 Apple Inc. All rights reserved.
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

#include "Identifier.h"
#include "JSGenerator.h"
#include "JSInternalFieldObjectImpl.h"
#include "ScriptFetchParameters.h"
#include <wtf/ListHashSet.h>

namespace JSC {

class JSModuleEnvironment;
class JSModuleNamespaceObject;
class JSMap;

// Based on the Source Text Module Record
// http://www.ecma-international.org/ecma-262/6.0/#sec-source-text-module-records
class AbstractModuleRecord : public JSInternalFieldObjectImpl<2> {
    friend class LLIntOffsetsExtractor;
public:
    using Base = JSInternalFieldObjectImpl<2>;

    static constexpr bool needsDestruction = true;

    template<typename CellType, SubspaceAccess>
    static void subspaceFor(VM&)
    {
        RELEASE_ASSERT_NOT_REACHED();
    }

    using Argument = JSGenerator::Argument;
    using State = JSGenerator::State;
    using ResumeMode = JSGenerator::ResumeMode;

    enum class Field : uint32_t {
        State,
        Frame,
    };

    static_assert(numberOfInternalFields == 2);
    static std::array<JSValue, numberOfInternalFields> initialValues()
    {
        return { {
            jsNumber(static_cast<int32_t>(State::Init)),
            jsUndefined(),
        } };
    }

    // https://tc39.github.io/ecma262/#sec-source-text-module-records
    struct ExportEntry {
        enum class Type {
            Local,
            Indirect,
            Namespace,
        };

        static ExportEntry createLocal(const Identifier& exportName, const Identifier& localName);
        static ExportEntry createIndirect(const Identifier& exportName, const Identifier& importName, const Identifier& moduleName);
        static ExportEntry createNamespace(const Identifier& exportName, const Identifier& moduleName);

        Type type;
        Identifier exportName;
        Identifier moduleName;
        Identifier importName;
        Identifier localName;
    };

    enum class ImportEntryType { Single, Namespace };
    struct ImportEntry {
        ImportEntryType type;
        Identifier moduleRequest;
        Identifier importName;
        Identifier localName;
    };

    typedef WTF::ListHashSet<RefPtr<UniquedStringImpl>, IdentifierRepHash> OrderedIdentifierSet;
    typedef UncheckedKeyHashMap<RefPtr<UniquedStringImpl>, ImportEntry, IdentifierRepHash, HashTraits<RefPtr<UniquedStringImpl>>> ImportEntries;
    typedef UncheckedKeyHashMap<RefPtr<UniquedStringImpl>, ExportEntry, IdentifierRepHash, HashTraits<RefPtr<UniquedStringImpl>>> ExportEntries;

    struct ModuleRequest {
        RefPtr<UniquedStringImpl> m_specifier;
        RefPtr<ScriptFetchParameters> m_attributes;
    };

    DECLARE_EXPORT_INFO;

    void appendRequestedModule(const Identifier&, RefPtr<ScriptFetchParameters>&&);
    void addStarExportEntry(const Identifier&);
    void addImportEntry(const ImportEntry&);
    void addExportEntry(const ExportEntry&);

    std::optional<ImportEntry> tryGetImportEntry(UniquedStringImpl* localName);
    std::optional<ExportEntry> tryGetExportEntry(UniquedStringImpl* exportName);

    const Identifier& moduleKey() const { return m_moduleKey; }
    const Vector<ModuleRequest>& requestedModules() const { return m_requestedModules; }
    const ExportEntries& exportEntries() const { return m_exportEntries; }
    const ImportEntries& importEntries() const { return m_importEntries; }
    const OrderedIdentifierSet& starExportEntries() const { return m_starExportEntries; }

    void dump();

    struct Resolution {
        enum class Type { Resolved, NotFound, Ambiguous, Error };

        static Resolution notFound();
        static Resolution error();
        static Resolution ambiguous();

        Type type;
        AbstractModuleRecord* moduleRecord;
        Identifier localName;
    };

    Resolution resolveExport(JSGlobalObject*, const Identifier& exportName);
    Resolution resolveImport(JSGlobalObject*, const Identifier& localName);

    AbstractModuleRecord* hostResolveImportedModule(JSGlobalObject*, const Identifier& moduleName);

    JSModuleNamespaceObject* getModuleNamespace(JSGlobalObject*);
    
    JSModuleEnvironment* moduleEnvironment()
    {
        ASSERT(m_moduleEnvironment);
        return m_moduleEnvironment.get();
    }

    JSModuleEnvironment* moduleEnvironmentMayBeNull()
    {
        return m_moduleEnvironment.get();
    }

    Synchronousness link(JSGlobalObject*, JSValue scriptFetcher);
    JS_EXPORT_PRIVATE JSValue evaluate(JSGlobalObject*, JSValue sentValue, JSValue resumeMode);
    WriteBarrier<Unknown>& internalField(Field field) { return Base::internalField(static_cast<uint32_t>(field)); }
    WriteBarrier<Unknown> internalField(Field field) const { return Base::internalField(static_cast<uint32_t>(field)); }

protected:
    AbstractModuleRecord(VM&, Structure*, const Identifier&);
    void finishCreation(JSGlobalObject*, VM&);

    DECLARE_VISIT_CHILDREN;

    void setModuleEnvironment(JSGlobalObject*, JSModuleEnvironment*);

private:
    struct ResolveQuery;
    static Resolution resolveExportImpl(JSGlobalObject*, const ResolveQuery&);
    std::optional<Resolution> tryGetCachedResolution(UniquedStringImpl* exportName);
    void cacheResolution(UniquedStringImpl* exportName, const Resolution&);

    // The loader resolves the given module name to the module key. The module key is the unique value to represent this module.
    Identifier m_moduleKey;

    // Currently, we don't keep the occurrence order of the import / export entries.
    // So, we does not guarantee the order of the errors.
    // e.g. The import declaration that occurr later than the another import declaration may
    //      throw the error even if the former import declaration also has the invalid content.
    //
    //      import ... // (1) this has some invalid content.
    //      import ... // (2) this also has some invalid content.
    //
    //      In the above case, (2) may throw the error earlier than (1)
    //
    // But, in all the cases, we will throw the syntax error. So except for the content of the syntax error,
    // there are no difference.

    // Map localName -> ImportEntry.
    ImportEntries m_importEntries;

    // Map exportName -> ExportEntry.
    ExportEntries m_exportEntries;

    // Save the occurrence order since resolveExport requires it.
    OrderedIdentifierSet m_starExportEntries;

    // Save the occurrence order since the module loader loads and runs the modules in this order.
    // http://www.ecma-international.org/ecma-262/6.0/#sec-moduleevaluation
    Vector<ModuleRequest> m_requestedModules;

    WriteBarrier<JSMap> m_dependenciesMap;
    
    WriteBarrier<JSModuleNamespaceObject> m_moduleNamespaceObject;

    WriteBarrier<JSModuleEnvironment> m_moduleEnvironment;

    // We assume that all the AbstractModuleRecord are retained by JSModuleLoader's registry.
    // So here, we don't visit each object for GC. The resolution cache map caches the once
    // looked up correctly resolved resolution, since (1) we rarely looked up the non-resolved one,
    // and (2) if we cache all the attempts the size of the map becomes infinitely large.
    typedef UncheckedKeyHashMap<RefPtr<UniquedStringImpl>, Resolution, IdentifierRepHash, HashTraits<RefPtr<UniquedStringImpl>>> Resolutions;
    Resolutions m_resolutionCache;
};

} // namespace JSC
