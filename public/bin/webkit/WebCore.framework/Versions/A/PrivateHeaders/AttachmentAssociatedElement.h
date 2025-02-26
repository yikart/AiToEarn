/*
 * Copyright (C) 2024 Apple Inc. All rights reserved.
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

#if ENABLE(ATTACHMENT_ELEMENT)

#include <wtf/text/WTFString.h>

namespace WebCore {

class Document;
class Element;
class HTMLAttachmentElement;
class HTMLElement;
class TreeScope;

enum class AttachmentAssociatedElementType : uint8_t {
    None,
    Image,
    Source,
};

class AttachmentAssociatedElement {
public:
    void ref() const { refAttachmentAssociatedElement(); }
    void deref() const { derefAttachmentAssociatedElement(); }

    virtual ~AttachmentAssociatedElement() = default;

    virtual HTMLElement& asHTMLElement() = 0;
    virtual const HTMLElement& asHTMLElement() const = 0;

    virtual AttachmentAssociatedElementType attachmentAssociatedElementType() const = 0;

    virtual void setAttachmentElement(Ref<HTMLAttachmentElement>&&);

    RefPtr<HTMLAttachmentElement> attachmentElement() const;
    const String& attachmentIdentifier() const;
    void didUpdateAttachmentIdentifier();

protected:
    void copyAttachmentAssociatedPropertiesFromElement(const AttachmentAssociatedElement&);
    void cloneAttachmentAssociatedElementWithoutAttributesAndChildren(AttachmentAssociatedElement&, Document&);

private:
    virtual void refAttachmentAssociatedElement() const = 0;
    virtual void derefAttachmentAssociatedElement() const = 0;

    virtual Ref<Element> cloneElementWithoutAttributesAndChildren(TreeScope&) = 0;
    virtual void copyNonAttributePropertiesFromElement(const Element&) = 0;

    virtual AttachmentAssociatedElement* asAttachmentAssociatedElement() = 0;

    String m_pendingClonedAttachmentID;
};

} // namespace WebCore

#endif // ENABLE(ATTACHMENT_ELEMENT)
