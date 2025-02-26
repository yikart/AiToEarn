/*
 * Copyright (C) 2020 Apple Inc. All rights reserved.
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

#include "MouseEvent.h"
#include "MouseEventInit.h"

namespace WebCore {

class DataTransfer;

enum class SyntheticClickType : uint8_t;

struct DragEventInit : public MouseEventInit {
    RefPtr<DataTransfer> dataTransfer;
};

class DragEvent : public MouseEvent {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED(DragEvent);
public:
    using Init = DragEventInit;

    static Ref<DragEvent> create(const AtomString& eventType, DragEventInit&&);
    static Ref<DragEvent> createForBindings();
    static Ref<DragEvent> create(const AtomString& type, CanBubble, IsCancelable, IsComposed, MonotonicTime timestamp, RefPtr<WindowProxy>&&, int detail,
        const IntPoint& screenLocation, const IntPoint& windowLocation, double movementX, double movementY, OptionSet<Modifier>, MouseButton, unsigned short buttons,
        EventTarget* relatedTarget, double force, SyntheticClickType, DataTransfer* = nullptr, IsSimulated = IsSimulated::No, IsTrusted = IsTrusted::Yes);

    virtual ~DragEvent();

    DataTransfer* dataTransfer() const { return m_dataTransfer.get(); }

private:
    DragEvent(const AtomString& eventType, DragEventInit&&);
    DragEvent(const AtomString& type, CanBubble, IsCancelable, IsComposed, MonotonicTime timestamp, RefPtr<WindowProxy>&&, int detail,
        const IntPoint& screenLocation, const IntPoint& windowLocation, double movementX, double movementY, OptionSet<Modifier>, MouseButton, unsigned short buttons,
        EventTarget* relatedTarget, double force, SyntheticClickType, DataTransfer*, IsSimulated, IsTrusted);
    DragEvent();

    RefPtr<DataTransfer> m_dataTransfer;
};

} // namespace WebCore
