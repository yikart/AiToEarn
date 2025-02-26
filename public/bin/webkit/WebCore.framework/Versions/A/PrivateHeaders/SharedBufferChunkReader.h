/*
 * Copyright (C) 2011 Google Inc. All rights reserved.
 * Copyright (C) 2021 Apple Inc.  All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *     * Neither the name of Google Inc. nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#if ENABLE(MHTML)

#include "SharedBuffer.h"
#include <wtf/Vector.h>
#include <wtf/text/WTFString.h>

namespace WebCore {

class WEBCORE_EXPORT SharedBufferChunkReader {
public:
    SharedBufferChunkReader(FragmentedSharedBuffer*, const Vector<char>& separator);
    SharedBufferChunkReader(FragmentedSharedBuffer*, const char* separator);

    void setSeparator(const Vector<char>&);
    void setSeparator(const char*);

    // Returns false when the end of the buffer was reached.
    bool nextChunk(Vector<uint8_t>& data, bool includeSeparator = false);

    // Returns a null string when the end of the buffer has been reached.
    String nextChunkAsUTF8StringWithLatin1Fallback(bool includeSeparator = false);

    // Reads size bytes at the current location in the buffer, without changing the buffer position.
    // Returns the number of bytes read. That number might be less than the specified size if the end of the buffer was reached.
    size_t peek(Vector<uint8_t>&, size_t);

private:
    FragmentedSharedBuffer::DataSegmentVector::const_iterator m_iteratorCurrent;
    const FragmentedSharedBuffer::DataSegmentVector::const_iterator m_iteratorEnd;
    const uint8_t* m_segment { nullptr };
    size_t m_segmentIndex { 0 };
    Vector<char> m_separator { false };
    size_t m_separatorIndex { 0 };
};

}

#endif
