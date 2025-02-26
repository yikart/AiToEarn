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

#if ENABLE(WEBASSEMBLY)

#include <cstdint>

namespace JSC {

namespace Wasm {

// These limits are arbitrary except that they match the limits imposed
// by other browsers' implementation of WebAssembly. It is desirable for
// us to accept at least the same inputs.

constexpr size_t maxTypes = 1000000;
constexpr size_t maxFunctions = 1000000;
constexpr size_t maxImports = 100000;
constexpr size_t maxExports = 100000;
constexpr size_t maxExceptions = 100000;
constexpr size_t maxGlobals = 1000000;
constexpr size_t maxDataSegments = 100000;
constexpr size_t maxStructFieldCount = 10000;
constexpr size_t maxArrayNewFixedArgs = 10000;
constexpr size_t maxRecursionGroupCount = 1000000;
constexpr size_t maxNumberOfRecursionGroups = 1000000;
constexpr size_t maxSubtypeSupertypeCount = 1;
constexpr size_t maxSubtypeDepth = 63;

constexpr size_t maxStringSize = 100000;
constexpr size_t maxModuleSize = 1024 * 1024 * 1024;
constexpr size_t maxFunctionSize = 7654321;
constexpr size_t maxFunctionLocals = 50000;
constexpr size_t maxFunctionParams = 1000;
constexpr size_t maxFunctionReturns = 1000;

constexpr size_t maxTableEntries = 10000000;
constexpr unsigned maxTables = 1000000;

// Limit of GC arrays in bytes. This is not included in the limits in the
// JS API spec, but we set a limit to avoid complicated boundary conditions.
constexpr size_t maxArraySizeInBytes = 1 << 30;

} } // namespace JSC::Wasm

#endif // ENABLE(WEBASSEMBLY)
