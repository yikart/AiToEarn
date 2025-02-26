/*
 * Copyright (C) 2017 Yusuke Suzuki <utatane.tea@gmail.com>
 * Copyright (C) 2018-2022 Apple Inc. All rights reserved.
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

#include "JSObject.h"
#include "ScriptFetchParameters.h"
#include <wtf/Ref.h>

namespace JSC {

class JSScriptFetchParameters final : public JSCell {
public:
    using Base = JSCell;

    static constexpr unsigned StructureFlags = Base::StructureFlags | StructureIsImmortal;
    static constexpr bool needsDestruction = true;

    DECLARE_EXPORT_INFO;

    template<typename CellType, SubspaceAccess mode>
    static GCClient::IsoSubspace* subspaceFor(VM& vm)
    {
        return vm.scriptFetchParametersSpace<mode>();
    }

    inline static Structure* createStructure(VM&, JSGlobalObject*, JSValue);

    static JSScriptFetchParameters* create(VM& vm, Structure* structure, Ref<ScriptFetchParameters>&& parameters)
    {
        auto* result = new (NotNull, allocateCell<JSScriptFetchParameters>(vm)) JSScriptFetchParameters(vm, structure, WTFMove(parameters));
        result->finishCreation(vm);
        return result;
    }

    static JSScriptFetchParameters* create(VM& vm, Ref<ScriptFetchParameters>&& parameters)
    {
        return create(vm, vm.scriptFetchParametersStructure.get(), WTFMove(parameters));
    }

    ScriptFetchParameters& parameters() const
    {
        return m_parameters.get();
    }

    static void destroy(JSCell*);

private:
    JSScriptFetchParameters(VM& vm, Structure* structure, Ref<ScriptFetchParameters>&& parameters)
        : Base(vm, structure)
        , m_parameters(WTFMove(parameters))
    {
    }

    Ref<ScriptFetchParameters> m_parameters;
};

} // namespace JSC
