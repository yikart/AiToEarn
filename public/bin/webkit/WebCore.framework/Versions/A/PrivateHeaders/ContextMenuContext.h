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
 * THIS SOFTWARE IS PROVIDED BY APPLE, INC. ``AS IS'' AND ANY
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
 *
 */

#pragma once

#if ENABLE(CONTEXT_MENUS)

#include "HitTestResult.h"
#include "Image.h"

namespace WebCore {

class Event;

enum class ContextMenuContextType : uint8_t {
    ContextMenu,
#if ENABLE(SERVICE_CONTROLS)
    ServicesMenu,
#endif // ENABLE(SERVICE_CONTROLS)
#if ENABLE(MEDIA_CONTROLS_CONTEXT_MENUS)
    MediaControls,
#endif // ENABLE(MEDIA_CONTROLS_CONTEXT_MENUS)
};

class ContextMenuContext {
public:
    using Type = ContextMenuContextType;

    ContextMenuContext();
    ContextMenuContext(Type, const HitTestResult&, RefPtr<Event>&&);

    ~ContextMenuContext();

    ContextMenuContext& operator=(const ContextMenuContext&);

    Type type() const { return m_type; }

    const HitTestResult& hitTestResult() const { return m_hitTestResult; }
    Event* event() const { return m_event.get(); }

    void setSelectedText(const String& selectedText) { m_selectedText = selectedText; }
    const String& selectedText() const { return m_selectedText; }

    bool hasEntireImage() const { return m_hasEntireImage; }

#if ENABLE(SERVICE_CONTROLS)
    void setControlledImage(Image* controlledImage) { m_controlledImage = controlledImage; }
    Image* controlledImage() const { return m_controlledImage.get(); }
#endif

#if ENABLE(CONTEXT_MENU_QR_CODE_DETECTION)
    void setPotentialQRCodeNodeSnapshotImage(Image* image) { m_potentialQRCodeNodeSnapshotImage = image; }
    Image* potentialQRCodeNodeSnapshotImage() const { return m_potentialQRCodeNodeSnapshotImage.get(); }

    void setPotentialQRCodeViewportSnapshotImage(Image* image) { m_potentialQRCodeViewportSnapshotImage = image; }
    Image* potentialQRCodeViewportSnapshotImage() const { return m_potentialQRCodeViewportSnapshotImage.get(); }
#endif

private:
    Type m_type { Type::ContextMenu };
    HitTestResult m_hitTestResult;
    RefPtr<Event> m_event;
    String m_selectedText;
    bool m_hasEntireImage { false };

#if ENABLE(SERVICE_CONTROLS)
    RefPtr<Image> m_controlledImage;
#endif

#if ENABLE(CONTEXT_MENU_QR_CODE_DETECTION)
    RefPtr<Image> m_potentialQRCodeNodeSnapshotImage;
    RefPtr<Image> m_potentialQRCodeViewportSnapshotImage;
#endif
};

} // namespace WebCore

#endif // ENABLE(CONTEXT_MENUS)
