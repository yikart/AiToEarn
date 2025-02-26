/*
 * Copyright (C) 2019-2022 Apple Inc. All rights reserved.
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

#include "JSInternalFieldObjectImpl.h"

namespace JSC {

class JSGenerator final : public JSInternalFieldObjectImpl<6> {
public:
    using Base = JSInternalFieldObjectImpl<6>;

    // JSGenerator has one inline storage slot, which is pointing internalField(0).
    static size_t allocationSize(Checked<size_t> inlineCapacity)
    {
        ASSERT_UNUSED(inlineCapacity, inlineCapacity == 0U);
        return sizeof(JSGenerator);
    }

    template<typename CellType, SubspaceAccess mode>
    static GCClient::IsoSubspace* subspaceFor(VM& vm)
    {
        return vm.generatorSpace<mode>();
    }

    enum class ResumeMode : int32_t {
        NormalMode = 0,
        ReturnMode = 1,
        ThrowMode = 2
    };

    enum class State : int32_t {
        Completed = -1,
        Executing = -2,
        Init = 0,
    };

    // [this], @generator, @generatorState, @generatorValue, @generatorResumeMode, @generatorFrame.
    enum class Argument : int32_t {
        ThisValue = 0,
        Generator = 1,
        State = 2,
        Value = 3,
        ResumeMode = 4,
        Frame = 5,
        NumberOfArguments = Frame,
    };

    enum class Field : uint32_t {
        // FIXME: JSGenerator should support PolyProto, since generator tends to be created with poly proto mode.
        // We reserve the first internal field for PolyProto property. This offset is identical to JSFinalObject's first inline storage slot which will be used for PolyProto.
        PolyProto = 0,
        State,
        Next,
        This,
        Frame,
        Context,
    };
    static_assert(numberOfInternalFields == 6);
    static std::array<JSValue, numberOfInternalFields> initialValues()
    {
        return { {
            jsNull(),
            jsNumber(static_cast<int32_t>(State::Init)),
            jsUndefined(),
            jsUndefined(),
            jsUndefined(),
            jsUndefined(),
        } };
    }

    static JSGenerator* create(VM&, Structure*);
    static Structure* createStructure(VM&, JSGlobalObject*, JSValue);

    DECLARE_EXPORT_INFO;

    DECLARE_VISIT_CHILDREN;

private:
    JSGenerator(VM&, Structure*);
    void finishCreation(VM&);
};

OVERLOAD_RELATIONAL_OPERATORS_FOR_ENUM_CLASS_WITH_INTEGRALS(JSGenerator::Argument);

} // namespace JSC
