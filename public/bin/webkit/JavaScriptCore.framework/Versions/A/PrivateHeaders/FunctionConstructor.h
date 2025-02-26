/*
 *  Copyright (C) 1999-2000 Harri Porten (porten@kde.org)
 *  Copyright (C) 2006-2021 Apple Inc. All rights reserved.
 *
 *  This library is free software; you can redistribute it and/or
 *  modify it under the terms of the GNU Lesser General Public
 *  License as published by the Free Software Foundation; either
 *  version 2 of the License, or (at your option) any later version.
 *
 *  This library is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 *  Lesser General Public License for more details.
 *
 *  You should have received a copy of the GNU Lesser General Public
 *  License along with this library; if not, write to the Free Software
 *  Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301  USA
 *
 */

#pragma once

#include "InternalFunction.h"

namespace WTF {
class TextPosition;
}

namespace JSC {

class FunctionPrototype;
enum class SourceTaintedOrigin : uint8_t;

class FunctionConstructor final : public InternalFunction {
public:
    typedef InternalFunction Base;

    static FunctionConstructor* create(VM& vm, Structure* structure, FunctionPrototype* functionPrototype)
    {
        FunctionConstructor* constructor = new (NotNull, allocateCell<FunctionConstructor>(vm)) FunctionConstructor(vm, structure);
        constructor->finishCreation(vm, functionPrototype);
        return constructor;
    }

    DECLARE_INFO;

    inline static Structure* createStructure(VM&, JSGlobalObject*, JSValue);

private:
    FunctionConstructor(VM&, Structure*);
    void finishCreation(VM&, FunctionPrototype*);
};
STATIC_ASSERT_ISO_SUBSPACE_SHARABLE(FunctionConstructor, InternalFunction);

enum class FunctionConstructionMode {
    Function,
    Generator,
    Async,
    AsyncGenerator,
};

JSObject* constructFunction(JSGlobalObject*, const ArgList&, const Identifier& functionName, const SourceOrigin&, const String& sourceURL, SourceTaintedOrigin, const WTF::TextPosition&, FunctionConstructionMode = FunctionConstructionMode::Function, JSValue newTarget = JSValue());
JSObject* constructFunction(JSGlobalObject*, CallFrame*, const ArgList&, FunctionConstructionMode = FunctionConstructionMode::Function, JSValue newTarget = JSValue());

JS_EXPORT_PRIVATE JSObject* constructFunctionSkippingEvalEnabledCheck(
    JSGlobalObject*, String&& program, LexicallyScopedFeatures, const Identifier&, const SourceOrigin&,
    const String&, SourceTaintedOrigin, const WTF::TextPosition&, int overrideLineNumber = -1,
    std::optional<int> functionConstructorParametersEndPosition = std::nullopt,
    FunctionConstructionMode = FunctionConstructionMode::Function, JSValue newTarget = JSValue());

} // namespace JSC
