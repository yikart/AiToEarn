/*
 * Copyright (C) 2014-2017 Apple Inc. All rights reserved.
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

#include "CellState.h"
#include "IndexingType.h"
#include "JSTypeInfo.h"
#include "StructureID.h"

namespace JSC {

class TypeInfoBlob {
    friend class LLIntOffsetsExtractor;
public:
    TypeInfoBlob() = default;

    TypeInfoBlob(IndexingType indexingModeIncludingHistory, const TypeInfo& typeInfo)
    {
        u.fields.indexingModeIncludingHistory = indexingModeIncludingHistory;
        u.fields.type = typeInfo.type();
        u.fields.inlineTypeFlags = typeInfo.inlineTypeFlags();
        u.fields.defaultCellState = CellState::DefinitelyWhite;
    }

    void operator=(const TypeInfoBlob& other) { u.word = other.u.word; }

    IndexingType indexingModeIncludingHistory() const { return u.fields.indexingModeIncludingHistory; }
    Dependency fencedIndexingModeIncludingHistory(IndexingType& indexingType)
    {
        return Dependency::loadAndFence(&u.fields.indexingModeIncludingHistory, indexingType);
    }
    void setIndexingModeIncludingHistory(IndexingType indexingModeIncludingHistory) { u.fields.indexingModeIncludingHistory = indexingModeIncludingHistory; }
    JSType type() const { return u.fields.type; }
    TypeInfo::InlineTypeFlags inlineTypeFlags() const { return u.fields.inlineTypeFlags; }
    
    TypeInfo typeInfo(TypeInfo::OutOfLineTypeFlags outOfLineTypeFlags) const { return TypeInfo(type(), inlineTypeFlags(), outOfLineTypeFlags); }
    CellState defaultCellState() const { return u.fields.defaultCellState; }

    static constexpr int32_t typeInfoBlob(IndexingType indexingModeIncludingHistory, JSType type, TypeInfo::InlineTypeFlags inlineTypeFlags)
    {
#if CPU(LITTLE_ENDIAN)
        return static_cast<int32_t>((static_cast<uint32_t>(indexingModeIncludingHistory) << 0) | (static_cast<uint32_t>(type) << 8) | (static_cast<uint32_t>(inlineTypeFlags) << 16) | (static_cast<uint32_t>(CellState::DefinitelyWhite) << 24));
#else
        return static_cast<int32_t>((static_cast<uint32_t>(indexingModeIncludingHistory) << 24) | (static_cast<uint32_t>(type) << 16) | (static_cast<uint32_t>(inlineTypeFlags) << 8) | (static_cast<uint32_t>(CellState::DefinitelyWhite) << 0));
#endif
    }

    int32_t blob() const { return u.word; }

    static constexpr ptrdiff_t indexingModeIncludingHistoryOffset()
    {
        return OBJECT_OFFSETOF(TypeInfoBlob, u.fields.indexingModeIncludingHistory);
    }

private:
    union Data {
        struct {
            IndexingType indexingModeIncludingHistory;
            JSType type;
            TypeInfo::InlineTypeFlags inlineTypeFlags;
            CellState defaultCellState;
        } fields;
        int32_t word;

        Data() { word = 0xbbadbeef; }
    };

    Data u;
};

} // namespace JSC
