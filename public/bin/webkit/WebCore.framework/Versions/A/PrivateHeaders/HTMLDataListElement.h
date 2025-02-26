/*
 * Copyright (c) 2009, Google Inc. All rights reserved.
 * Copyright (C) 2010-2020 Apple Inc. All rights reserved.
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

#if ENABLE(DATALIST_ELEMENT)

#include "HTMLElement.h"
#include "TypedElementDescendantIterator.h"

namespace WebCore {

class HTMLCollection;

class HTMLDataListElement final : public HTMLElement {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED(HTMLDataListElement);
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(HTMLDataListElement);
public:
    static Ref<HTMLDataListElement> create(const QualifiedName&, Document&);
    ~HTMLDataListElement();

    Ref<HTMLCollection> options();

    void optionElementChildrenChanged();

    static bool isSuggestion(const HTMLOptionElement& descendant);
    using SuggestionRange = FilteredElementDescendantRange<HTMLOptionElement, isSuggestion>;
    SuggestionRange suggestions() const;

private:
    void didMoveToNewDocument(Document& oldDocument, Document& newDocument) final;

    void childrenChanged(const ChildChange&) final;

    HTMLDataListElement(const QualifiedName&, Document&);
};

} // namespace WebCore

#endif // ENABLE(DATALIST_ELEMENT)
