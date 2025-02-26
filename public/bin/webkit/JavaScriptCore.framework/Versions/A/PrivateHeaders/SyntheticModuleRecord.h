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

#include "AbstractModuleRecord.h"
#include "SourceCode.h"

namespace JSC {

class JSGlobalObject;
class JSInternalPromise;

// https://tc39.es/proposal-json-modules/#sec-synthetic-module-records
class SyntheticModuleRecord final : public AbstractModuleRecord {
    friend class LLIntOffsetsExtractor;
public:
    using Base = AbstractModuleRecord;

    DECLARE_EXPORT_INFO;

    static constexpr bool needsDestruction = true;
    static void destroy(JSCell*);

    template<typename CellType, SubspaceAccess mode>
    static GCClient::IsoSubspace* subspaceFor(VM& vm)
    {
        return vm.syntheticModuleRecordSpace<mode>();
    }

    static Structure* createStructure(VM&, JSGlobalObject*, JSValue);
    static SyntheticModuleRecord* create(JSGlobalObject*, VM&, Structure*, const Identifier& moduleKey);

    static SyntheticModuleRecord* parseJSONModule(JSGlobalObject*, const Identifier& moduleKey, SourceCode&&);

    Synchronousness link(JSGlobalObject*, JSValue scriptFetcher);
    JS_EXPORT_PRIVATE JSValue evaluate(JSGlobalObject*);

private:
    SyntheticModuleRecord(VM&, Structure*, const Identifier& moduleKey);

    static SyntheticModuleRecord* tryCreateDefaultExportSyntheticModule(JSGlobalObject*, const Identifier& moduleKey, JSValue);
    static SyntheticModuleRecord* tryCreateWithExportNamesAndValues(JSGlobalObject*, const Identifier& moduleKey, const Vector<Identifier, 4>& exportNames, const MarkedArgumentBuffer& exportValues);

    void finishCreation(JSGlobalObject*, VM&);

    DECLARE_VISIT_CHILDREN;
};

} // namespace JSC
