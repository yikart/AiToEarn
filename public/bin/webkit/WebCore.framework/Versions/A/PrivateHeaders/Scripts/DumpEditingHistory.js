(() => {
    let initialized = false;
    let globalNodeMap = new EditingHistory.GlobalNodeMap();
    let topLevelUpdates = [];
    let currentChildUpdates = [];
    let isProcessingTopLevelUpdate = false;
    let lastKnownSelectionState = null;
    let mutationObserver = new MutationObserver(records => appendDOMUpdatesFromRecords(records));

    function beginProcessingTopLevelUpdate() {
        isProcessingTopLevelUpdate = true;
    }

    function endProcessingTopLevelUpdate(topLevelUpdate) {
        topLevelUpdates.push(topLevelUpdate);
        currentChildUpdates = [];
        isProcessingTopLevelUpdate = false;
    }

    function appendDOMUpdatesFromRecords(records) {
        if (!records.length)
            return;

        let newUpdates = EditingHistory.DOMUpdate.fromRecords(records, globalNodeMap);
        if (isProcessingTopLevelUpdate)
            currentChildUpdates = currentChildUpdates.concat(newUpdates);
        else
            topLevelUpdates = topLevelUpdates.concat(newUpdates);
    }

    function appendSelectionUpdateIfNecessary() {
        let newSelectionState = EditingHistory.SelectionState.fromSelection(getSelection(), globalNodeMap);
        if (newSelectionState.isEqual(lastKnownSelectionState))
            return;

        let update = new EditingHistory.SelectionUpdate(globalNodeMap, newSelectionState);
        if (isProcessingTopLevelUpdate)
            currentChildUpdates.push(update);
        else
            topLevelUpdates.push(update);
        lastKnownSelectionState = newSelectionState;
    }

    document.body.addEventListener("focus", () => {
        if (initialized)
            return;

        initialized = true;

        EditingHistory.getEditingHistoryAsJSONString = (formatted) => {
            let record = {};
            record.updates = topLevelUpdates.map(update => update.toObject());
            record.globalNodeMap = globalNodeMap.toObject();
            return formatted ? JSON.stringify(record, null, 4) : JSON.stringify(record);
        };

        document.addEventListener("selectionchange", () => {
            appendSelectionUpdateIfNecessary();
        });

        document.addEventListener("beforeinput", event => {
            appendDOMUpdatesFromRecords(mutationObserver.takeRecords());
            beginProcessingTopLevelUpdate();
        });

        document.addEventListener("input", event => {
            appendDOMUpdatesFromRecords(mutationObserver.takeRecords());
            let eventData = event.dataTransfer ? event.dataTransfer.getData("text/html") : event.data;
            lastKnownSelectionState = null;
            endProcessingTopLevelUpdate(new EditingHistory.InputEventUpdate(globalNodeMap, currentChildUpdates, event.inputType, eventData, event.timeStamp));
        });

        mutationObserver.observe(document, {
            childList: true,
            attributes: true,
            characterData: true,
            subtree: true,
            attributeOldValue: true,
            characterDataOldValue: true,
        });
    });
})();
