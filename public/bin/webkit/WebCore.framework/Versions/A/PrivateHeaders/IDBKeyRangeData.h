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

#include "IDBKeyData.h"
#include "IDBKeyRange.h"

namespace WebCore {

class IDBKey;

struct IDBKeyRangeData {
    IDBKeyRangeData()
    {
    }

    static IDBKeyRangeData allKeys()
    {
        IDBKeyRangeData result;
        result.lowerKey = IDBKeyData::minimum();
        result.upperKey = IDBKeyData::maximum();
        return result;
    }

    IDBKeyRangeData(IDBKey*);
    IDBKeyRangeData(const IDBKeyData&);

    IDBKeyRangeData(IDBKeyRange* keyRange)
    {
        if (!keyRange)
            return;

        lowerKey = keyRange->lower();
        upperKey = keyRange->upper();
        lowerOpen = keyRange->lowerOpen();
        upperOpen = keyRange->upperOpen();
    }

    IDBKeyRangeData(IDBKeyData&& lowerKey, IDBKeyData&& upperKey, bool lowerOpen, bool upperOpen)
        : lowerKey(WTFMove(lowerKey))
        , upperKey(WTFMove(upperKey))
        , lowerOpen(WTFMove(lowerOpen))
        , upperOpen(WTFMove(upperOpen))
    {
    }

    WEBCORE_EXPORT IDBKeyRangeData isolatedCopy() const;

    WEBCORE_EXPORT bool isExactlyOneKey() const;
    bool containsKey(const IDBKeyData&) const;
    bool isValid() const;

    IDBKeyData lowerKey;
    IDBKeyData upperKey;

    bool lowerOpen { false };
    bool upperOpen { false };

    bool isNull() const { return lowerKey.isNull() && upperKey.isNull(); };

#if !LOG_DISABLED
    String loggingString() const;
#endif
};

} // namespace WebCore
