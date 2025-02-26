/*
 * Copyright (C) 2016 Metrological Group B.V.
 * Copyright (C) 2016 Igalia S.L.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above
 *    copyright notice, this list of conditions and the following
 *    disclaimer in the documentation and/or other materials provided
 *    with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#if ENABLE(ENCRYPTED_MEDIA)

#include "Event.h"
#include "MediaEncryptedEventInit.h"

namespace JSC {
class ArrayBuffer;
}

namespace WebCore {

class MediaEncryptedEvent final : public Event {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED(MediaEncryptedEvent);
public:
    using Init = MediaEncryptedEventInit;

    static Ref<MediaEncryptedEvent> create(const AtomString& type, const MediaEncryptedEventInit& initializer, IsTrusted isTrusted = IsTrusted::No)
    {
        return adoptRef(*new MediaEncryptedEvent(type, initializer, isTrusted));
    }

    virtual ~MediaEncryptedEvent();

    String initDataType() { return m_initDataType; }
    JSC::ArrayBuffer* initData() { return m_initData.get(); }

private:
    MediaEncryptedEvent(const AtomString&, const MediaEncryptedEventInit&, IsTrusted);

    String m_initDataType;
    RefPtr<JSC::ArrayBuffer> m_initData;
};

} // namespace WebCore

#endif // ENABLE(ENCRYPTED_MEDIA)
