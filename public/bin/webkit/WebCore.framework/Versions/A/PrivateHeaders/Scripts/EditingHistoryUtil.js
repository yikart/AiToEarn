(() => {
    class Obfuscator {
        constructor() {
            this._scrambledLowercaseLetters = this._scramble(Array(26).fill().map((_, i) => 97 + i));
            this._scrambledUppercaseLetters = this._scramble(Array(26).fill().map((_, i) => 65 + i));
            this._scrambledNumbers = this._scramble(Array(10).fill().map((_, i) => 48 + i));
            this.enabled = false;
        }

        _scramble(array) {
            for (var i = array.length - 1; i > 0; i--) {
                let j = Math.floor(Math.random() * (i + 1));
                let temp = array[i];
                array[i] = array[j];
                array[j] = temp;
            }
            return array;
        }

        applyToText(text) {
            if (!this.enabled || !text)
                return text;

            let result = "";
            for (let index = 0; index < text.length; index++) {
                let code = text.charCodeAt(index);
                let numberIndex = this._scrambedNumberIndexForCode(code);
                let lowercaseIndex = this._scrambedLowercaseIndexForCode(code);
                let uppercaseIndex = this._scrambedUppercaseIndexForCode(code);

                if (numberIndex != null)
                    result += String.fromCharCode(this._scrambledNumbers[numberIndex]);
                else if (lowercaseIndex != null)
                    result += String.fromCharCode(this._scrambledLowercaseLetters[lowercaseIndex]);
                else if (uppercaseIndex != null)
                    result += String.fromCharCode(this._scrambledUppercaseLetters[uppercaseIndex]);
                else
                    result += text.charAt(index);
            }
            return result;
        }

        applyToFilename(filename) {
            if (!this.enabled || !filename)
                return filename;

            let components = filename.split(".");
            return components.map((component, index) => {
                if (index == components.length - 1)
                    return component;

                return this.applyToText(component);
            }).join(".");
        }

        _scrambedNumberIndexForCode(code) {
            return 48 <= code && code <= 57 ? code - 48 : null;
        }

        _scrambedLowercaseIndexForCode(code) {
            return 97 <= code && code <= 122 ? code - 97 : null;
        }

        _scrambedUppercaseIndexForCode(code) {
            return 65 <= code && code <= 90 ? code - 65 : null;
        }

        static shared() {
            if (!Obfuscator._sharedInstance)
                Obfuscator._sharedInstance = new Obfuscator();
            return Obfuscator._sharedInstance;
        }
    }

    function elementFromMarkdown(html) {
        let temporaryDiv = document.createElement("div");
        temporaryDiv.innerHTML = html;
        return temporaryDiv.children[0];
    }

    class GlobalNodeMap {
        constructor(nodesByGUID) {
            this._nodesByGUID = nodesByGUID ? nodesByGUID : new Map();
            this._guidsByNode = new Map();
            this._currentGUID = 0;
            for (let [guid, node] of this._nodesByGUID) {
                this._guidsByNode.set(node, guid);
                this._currentGUID = Math.max(this._currentGUID, guid);
            }
            this._currentGUID++;
        }

        nodesForGUIDs(guids) {
            if (!guids.map)
                guids = Array.from(guids);
            return guids.map(guid => this.nodeForGUID(guid));
        }

        guidsForNodes(nodes) {
            if (!nodes.map)
                nodes = Array.from(nodes);
            return nodes.map(node => this.guidForNode(node));
        }

        nodeForGUID(guid) {
            if (!guid)
                return null;

            return this._nodesByGUID.get(guid);
        }

        guidForNode(node) {
            if (!node)
                return 0;

            if (this.hasGUIDForNode(node))
                return this._guidsByNode.get(node);

            const guid = this._currentGUID;
            this._guidsByNode.set(node, guid);
            this._nodesByGUID.set(guid, node);
            this._currentGUID++;
            return guid;
        }

        hasGUIDForNode(node) {
            return !!this._guidsByNode.get(node);
        }

        nodes() {
            return Array.from(this._nodesByGUID.values());
        }

        toObject() {
            let nodesAndGUIDsToProcess = [], guidsToProcess = new Set();
            let guidsByNodeIterator = this._guidsByNode.entries();
            for (let entry = guidsByNodeIterator.next(); !entry.done; entry = guidsByNodeIterator.next()) {
                nodesAndGUIDsToProcess.push(entry.value);
                guidsToProcess.add(entry.value[1]);
            }

            let iterator = document.createNodeIterator(document.body, NodeFilter.SHOW_ALL);
            for (let node = iterator.nextNode(); node; node = iterator.nextNode()) {
                if (this.hasGUIDForNode(node))
                    continue;

                let newGUID = this.guidForNode(node);
                nodesAndGUIDsToProcess.push([node, newGUID]);
                guidsToProcess.add(newGUID);
            }

            let nodeInfoArray = [];
            while (nodesAndGUIDsToProcess.length) {
                let [node, guid] = nodesAndGUIDsToProcess.pop();
                let info = {};
                info.guid = guid;
                info.tagName = node.tagName;
                info.attributes = GlobalNodeMap.nodeAttributesToObject(node);
                info.type = node.nodeType;
                info.data = GlobalNodeMap.dataForNode(node);
                if (node.hasChildNodes()) {
                    info.childGUIDs = this.guidsForNodes(node.childNodes);
                    for (let childGUID of info.childGUIDs) {
                        if (!guidsToProcess.has(childGUID))
                            nodesAndGUIDsToProcess.push([this.nodeForGUID(childGUID), childGUID]);
                    }
                }
                nodeInfoArray.push(info);
            }

            return nodeInfoArray;
        }

        static fromObject(nodeInfoArray) {
            let nodesByGUID = new Map();
            for (let info of nodeInfoArray) {
                let node = null;
                if (info.type == Node.ELEMENT_NODE)
                    node = GlobalNodeMap.elementFromTagName(info.tagName, info.attributes, info.data);

                if (info.type == Node.TEXT_NODE)
                    node = document.createTextNode(info.data);

                if (info.type == Node.DOCUMENT_NODE)
                    node = document;

                console.assert(node);
                nodesByGUID.set(info.guid, node);
            }

            // Then, set child nodes for all nodes that do not appear in the DOM.
            for (let info of nodeInfoArray.filter(info => !!info.childGUIDs)) {
                let node = nodesByGUID.get(info.guid);
                for (let childGUID of info.childGUIDs)
                     node.appendChild(nodesByGUID.get(childGUID));
            }

            return new GlobalNodeMap(nodesByGUID);
        }

        static dataForNode(node) {
            if (node.nodeType === Node.TEXT_NODE)
                return Obfuscator.shared().applyToText(node.data);

            if (node.tagName && node.tagName.toLowerCase() === "attachment") {
                return {
                    type: node.file.type,
                    name: Obfuscator.shared().applyToFilename(node.file.name),
                    lastModified: new Date().getTime()
                };
            }

            return null;
        }

        static elementFromTagName(tagName, attributes, data) {
            let node = document.createElement(tagName);
            for (let attributeName in attributes)
                node.setAttribute(attributeName, attributes[attributeName]);

            if (tagName.toLowerCase() == "attachment") {
                node.file = new File([`File named '${data.name}'`], data.name, {
                    type: data.type,
                    lastModified: data.lastModified
                });
            }

            return node;
        }

        // Returns an Object containing attribute name => attribute value
        static nodeAttributesToObject(node, attributesToExclude=[]) {
            const excludeAttributesSet = new Set(attributesToExclude);
            if (!node.attributes)
                return null;

            let attributeMap = {};
            for (let index = 0; index < node.attributes.length; index++) {
                const attribute = node.attributes.item(index);
                const [localName, value] = [attribute.localName, attribute.value];
                if (excludeAttributesSet.has(localName))
                    continue;

                attributeMap[localName] = value;
            }

            return attributeMap;
        }

        descriptionHTMLForGUID(guid) {
            return `<span eh-guid=${guid} class="eh-node">${this.nodeForGUID(guid).nodeName}</span>`;
        }

        descriptionHTMLForNode(node) {
            if (!node)
                return "(null)";
            return `<span eh-guid=${this.guidForNode(node)} class="eh-node">${node.nodeName}</span>`;
        }
    }

    class SelectionState {
        constructor(nodeMap, startNode, startOffset, endNode, endOffset, anchorNode, anchorOffset, focusNode, focusOffset) {
            console.assert(nodeMap);
            this.nodeMap = nodeMap;
            this.startGUID = nodeMap.guidForNode(startNode);
            this.startOffset = startOffset;
            this.endGUID = nodeMap.guidForNode(endNode);
            this.endOffset = endOffset;
            this.anchorGUID = nodeMap.guidForNode(anchorNode);
            this.anchorOffset = anchorOffset;
            this.focusGUID = nodeMap.guidForNode(focusNode);
            this.focusOffset = focusOffset;
        }

        isEqual(otherSelectionState) {
            return otherSelectionState
                && this.startGUID === otherSelectionState.startGUID && this.startOffset === otherSelectionState.startOffset
                && this.endGUID === otherSelectionState.endGUID && this.endOffset === otherSelectionState.endOffset
                && this.anchorGUID === otherSelectionState.anchorGUID && this.anchorOffset === otherSelectionState.anchorOffset
                && this.focusGUID === otherSelectionState.focusGUID && this.focusOffset === otherSelectionState.focusOffset;
        }

        applyToSelection(selection) {
            selection.removeAllRanges();
            let range = document.createRange();
            range.setStart(this.nodeMap.nodeForGUID(this.startGUID), this.startOffset);
            range.setEnd(this.nodeMap.nodeForGUID(this.endGUID), this.endOffset);
            selection.addRange(range);
            selection.setBaseAndExtent(this.nodeMap.nodeForGUID(this.anchorGUID), this.anchorOffset, this.nodeMap.nodeForGUID(this.focusGUID), this.focusOffset);
        }

        static fromSelection(selection, nodeMap) {
            let [startNode, startOffset, endNode, endOffset] = [null, 0, null, 0];
            if (selection.rangeCount) {
                let selectedRange = selection.getRangeAt(0);
                startNode = selectedRange.startContainer;
                startOffset = selectedRange.startOffset;
                endNode = selectedRange.endContainer;
                endOffset = selectedRange.endOffset;
            }
            return new SelectionState(
                nodeMap, startNode, startOffset, endNode, endOffset,
                selection.anchorNode, selection.anchorOffset, selection.focusNode, selection.focusOffset
            );
        }

        toObject() {
            return {
                startGUID: this.startGUID, startOffset: this.startOffset, endGUID: this.endGUID, endOffset: this.endOffset,
                anchorGUID: this.anchorGUID, anchorOffset: this.anchorOffset, focusGUID: this.focusGUID, focusOffset: this.focusOffset
            };
        }

        static fromObject(json, nodeMap) {
            if (!json)
                return null;

            return new SelectionState(
                nodeMap, nodeMap.nodeForGUID(json.startGUID), json.startOffset, nodeMap.nodeForGUID(json.endGUID), json.endOffset,
                nodeMap.nodeForGUID(json.anchorGUID), json.anchorOffset, nodeMap.nodeForGUID(json.focusGUID), json.focusOffset
            );
        }
    }

    class DOMUpdate {
        constructor(nodeMap) {
            console.assert(nodeMap);
            this.nodeMap = nodeMap;
        }

        apply() {
            throw "Expected subclass implementation.";
        }

        unapply() {
            throw "Expected subclass implementation.";
        }

        targetNode() {
            return this.nodeMap.nodeForGUID(this.targetGUID);
        }

        detailsElement() {
            throw "Expected subclass implementation.";
        }

        static ofType(type) {
            if (!DOMUpdate._allTypes)
                DOMUpdate._allTypes = { ChildListUpdate, CharacterDataUpdate, AttributeUpdate, InputEventUpdate, SelectionUpdate };
            return DOMUpdate._allTypes[type];
        }

        static fromRecords(records, nodeMap) {
            let updates = []
                , characterDataUpdates = []
                , attributeUpdates = [];

            for (let record of records) {
                let target = record.target;
                switch (record.type) {
                case "characterData":
                    var update = new CharacterDataUpdate(nodeMap, nodeMap.guidForNode(target), record.oldValue, target.data)
                    updates.push(update);
                    characterDataUpdates.push(update);
                    break;
                case "childList":
                    var update = new ChildListUpdate(nodeMap, nodeMap.guidForNode(target), nodeMap.guidsForNodes(record.addedNodes), nodeMap.guidsForNodes(record.removedNodes), nodeMap.guidForNode(record.nextSibling))
                    updates.push(update);
                    break;
                case "attributes":
                    var update = new AttributeUpdate(nodeMap, nodeMap.guidForNode(target), record.attributeName, record.oldValue, target.getAttribute(record.attributeName))
                    updates.push(update);
                    attributeUpdates.push(update);
                    break;
                }
            }

            // Adjust all character data updates for the same target.
            characterDataUpdates.forEach((currentUpdate, index) => {
                if (index == characterDataUpdates.length - 1)
                    return;

                for (let nextUpdateIndex = index + 1; nextUpdateIndex < characterDataUpdates.length; nextUpdateIndex++) {
                    let nextUpdate = characterDataUpdates[nextUpdateIndex];
                    if (currentUpdate.targetGUID === nextUpdate.targetGUID) {
                        currentUpdate.newData = nextUpdate.oldData;
                        break;
                    }
                }
            });

            // Adjust all attribute updates for the same target and attribute name.
            attributeUpdates.forEach((currentUpdate, index) => {
                if (index == attributeUpdates.length - 1)
                    return;

                for (let nextUpdateIndex = index + 1; nextUpdateIndex < attributeUpdates.length; nextUpdateIndex++) {
                    let nextUpdate = attributeUpdates[nextUpdateIndex];
                    if (currentUpdate.targetGUID === nextUpdate.targetGUID && currentUpdate.attribute === nextUpdate.attribute) {
                        currentUpdate.newData = nextUpdate.oldData;
                        break;
                    }
                }
            });

            return updates;
        }
    }

    class ChildListUpdate extends DOMUpdate {
        constructor(nodeMap, targetGUID, addedGUIDs, removedGUIDs, nextSiblingGUID) {
            super(nodeMap);
            this.targetGUID = targetGUID;
            this.added = addedGUIDs;
            this.removed = removedGUIDs;
            this.nextSiblingGUID = nextSiblingGUID == undefined ? null : nextSiblingGUID;
            console.assert(nodeMap.nodeForGUID(targetGUID));
        }

        apply() {
            for (let removedNode of this._removedNodes())
                removedNode.remove();

            let target = this.targetNode();
            for (let addedNode of this._addedNodes())
                target.insertBefore(addedNode, this._nextSibling());
        }

        unapply() {
            for (let addedNode of this._addedNodes())
                addedNode.remove();

            let target = this.targetNode();
            for (let removedNode of this._removedNodes())
                target.insertBefore(removedNode, this._nextSibling());
        }

        _nextSibling() {
            if (this.nextSiblingGUID == null)
                return null;
            return this.nodeMap.nodeForGUID(this.nextSiblingGUID);
        }

        _removedNodes() {
            return this.nodeMap.nodesForGUIDs(this.removed);
        }

        _addedNodes() {
            return this.nodeMap.nodesForGUIDs(this.added);
        }

        toObject() {
            return {
                type: "ChildListUpdate",
                targetGUID: this.targetGUID,
                addedGUIDs: this.added,
                removedGUIDs: this.removed,
                nextSiblingGUID: this.nextSiblingGUID
            };
        }

        detailsElement() {
            let nextSibling = this._nextSibling();
            let html =
            `<details>
                <summary>child list changed</summary>
                <ul>
                    <li>parent: ${this.nodeMap.descriptionHTMLForGUID(this.targetGUID)}</li>
                    <li>added: [ ${[this._addedNodes().map(node => this.nodeMap.descriptionHTMLForNode(node))]} ]</li>
                    <li>removed: [ ${[this._removedNodes().map(node => this.nodeMap.descriptionHTMLForNode(node))]} ]</li>
                    <li>before sibling: ${nextSibling ? this.nodeMap.descriptionHTMLForNode(nextSibling) : "(null)"}</li>
                </ul>
            </details>`;
            return elementFromMarkdown(html);
        }

        static fromObject(json, nodeMap) {
            return new ChildListUpdate(nodeMap, json.targetGUID, json.addedGUIDs, json.removedGUIDs, json.nextSiblingGUID);
        }
    }

    class CharacterDataUpdate extends DOMUpdate {
        constructor(nodeMap, targetGUID, oldData, newData) {
            super(nodeMap);
            this.targetGUID = targetGUID;
            this.oldData = oldData;
            this.newData = newData;
            console.assert(nodeMap.nodeForGUID(targetGUID));
        }

        apply() {
            this.targetNode().data = this.newData;
        }

        unapply() {
            this.targetNode().data = this.oldData;
        }

        detailsElement() {
            let html =
            `<details>
                <summary>character data changed</summary>
                <ul>
                    <li>old: ${this.oldData != null ? "'" + this.oldData + "'" : "(null)"}</li>
                    <li>new: ${this.newData != null ? "'" + this.newData + "'" : "(null)"}</li>
                </ul>
            </details>`;
            return elementFromMarkdown(html);
        }

        toObject() {
            return {
                type: "CharacterDataUpdate",
                targetGUID: this.targetGUID,
                oldData: Obfuscator.shared().applyToText(this.oldData),
                newData: Obfuscator.shared().applyToText(this.newData)
            };
        }

        static fromObject(json, nodeMap) {
            return new CharacterDataUpdate(nodeMap, json.targetGUID, json.oldData, json.newData);
        }
    }

    class AttributeUpdate extends DOMUpdate {
        constructor(nodeMap, targetGUID, attribute, oldValue, newValue) {
            super(nodeMap);
            this.targetGUID = targetGUID;
            this.attribute = attribute;
            this.oldValue = oldValue;
            this.newValue = newValue;
            console.assert(nodeMap.nodeForGUID(targetGUID));
        }

        apply() {
            if (this.newValue == null)
                this.targetNode().removeAttribute(this.attribute);
            else
                this.targetNode().setAttribute(this.attribute, this.newValue);
        }

        unapply() {
            if (this.oldValue == null)
                this.targetNode().removeAttribute(this.attribute);
            else
                this.targetNode().setAttribute(this.attribute, this.oldValue);
        }

        detailsElement() {
            let html =
            `<details>
                <summary>attribute changed</summary>
                <ul>
                    <li>target: ${this.nodeMap.descriptionHTMLForGUID(this.targetGUID)}</li>
                    <li>attribute: ${this.attribute}</li>
                    <li>old: ${this.oldValue != null ? "'" + this.oldValue + "'" : "(null)"}</li>
                    <li>new: ${this.newValue != null ? "'" + this.newValue + "'" : "(null)"}</li>
                </ul>
            </details>`;
            return elementFromMarkdown(html);
        }

        toObject() {
            return {
                type: "AttributeUpdate",
                targetGUID: this.targetGUID,
                attribute: this.attribute,
                oldValue: this.oldValue,
                newValue: this.newValue
            };
        }

        static fromObject(json, nodeMap) {
            return new AttributeUpdate(nodeMap, json.targetGUID, json.attribute, json.oldValue, json.newValue);
        }
    }

    class SelectionUpdate extends DOMUpdate {
        constructor(nodeMap, state) {
            super(nodeMap);
            this.state = state;
        }

        // SelectionUpdates are not applied/unapplied by the normal means. The selection is applied via
        // DOMUpdateHistoryContext.applyCurrentSelectionState instead, which considers the updates before and after the
        // current update index.
        apply() { }
        unapply() { }

        toObject() {
            return {
                type: "SelectionUpdate",
                state: this.state ? this.state.toObject() : null
            };
        }

        static fromObject(json, nodeMap) {
            return new SelectionUpdate(nodeMap, SelectionState.fromObject(json.state, nodeMap));
        }

        _rangeDescriptionHTML() {
            return `(${this.nodeMap.descriptionHTMLForGUID(this.state.startGUID)}:${this.state.startOffset},
                ${this.nodeMap.descriptionHTMLForGUID(this.state.endGUID)}:${this.state.endOffset})`;
        }

        _anchorDescriptionHTML() {
            return `${this.nodeMap.descriptionHTMLForGUID(this.state.anchorGUID)}:${this.state.anchorOffset}`;
        }

        _focusDescriptionHTML() {
            return `${this.nodeMap.descriptionHTMLForGUID(this.state.focusGUID)}:${this.state.focusOffset}`;
        }

        detailsElement() {
            let html =
            `<details>
                <summary>Selection changed</summary>
                <ul>
                    <li>range: ${this._rangeDescriptionHTML()}</li>
                    <li>anchor: ${this._anchorDescriptionHTML()}</li>
                    <li>focus: ${this._focusDescriptionHTML()}</li>
                </ul>
            </details>`;
            return elementFromMarkdown(html);
        }
    }

    class InputEventUpdate extends DOMUpdate {
        constructor(nodeMap, updates, inputType, data, timeStamp) {
            super(nodeMap);
            this.updates = updates;
            this.inputType = inputType;
            this.data = data;
            this.timeStamp = timeStamp;
        }

        _obfuscatedData() {
            return this.inputType.indexOf("insert") == 0 ? Obfuscator.shared().applyToText(this.data) : this.data;
        }

        apply() {
            for (let update of this.updates)
                update.apply();
        }

        unapply() {
            for (let index = this.updates.length - 1; index >= 0; index--)
                this.updates[index].unapply();
        }

        toObject() {
            return {
                type: "InputEventUpdate",
                inputType: this.inputType,
                data: this._obfuscatedData(),
                timeStamp: this.timeStamp,
                updates: this.updates.map(update => update.toObject())
            };
        }

        static fromObject(json, nodeMap) {
            let updates = json.updates.map(update => DOMUpdate.ofType(update.type).fromObject(update, nodeMap));
            return new InputEventUpdate(nodeMap, updates, json.inputType, json.data, json.timeStamp);
        }

        detailsElement() {
            let html =
            `<details>
                <summary>Input (${this.inputType})</summary>
                <ul>
                    <li>time: ${this.timeStamp}</li>
                    <li>data: ${!this.data ? "(null)" : "'" + this.data + "'"}</li>
                </ul>
            </details>`;
            let topLevelDetails = elementFromMarkdown(html);
            for (let update of this.updates)
                topLevelDetails.children[topLevelDetails.childElementCount - 1].appendChild(update.detailsElement());
            return topLevelDetails;
        }
    }

    window.EditingHistory = {
        GlobalNodeMap,
        SelectionState,
        DOMUpdate,
        ChildListUpdate,
        CharacterDataUpdate,
        AttributeUpdate,
        SelectionUpdate,
        InputEventUpdate,
        Obfuscator
    };
})();
