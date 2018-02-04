class Stack {

    constructor(id, index, type) {
        this.id = id;
        this.type = type;
        this.index = index;
        this.cards = [];
        this.base = blanks[index];
        this.base.data("card-info", 
        { 
            stackIndex: this.index,
        });
    }

    static find(searchType, searchId) {
        var result;
        for(var i = 0; i < stacks.length; i++) {
            var type = stacks[i].type;
            var id = stacks[i].id;
            if(searchType === type && searchId === id) {
                result = stacks[i];
                break;
            } 
        }
        return result;
    }
    
    doActivateBase() {
        function tableBase() {
            div.css("position", "absolute")
               .css("width", WIDTH + "vw")
               .css("left", "" + (stack.index * LEFT_SEPARATION) + "vw")
               .css("top", "" + (TOP_SEPARATION * 0 + TOP_OFFSET) + "vw")
               .css("z-index", "" + 0);
        }
        
        function bankBase() {
            div.css("position", "absolute")
               .css("width", WIDTH + "vw")
               .css("left", "" + (stack.id * LEFT_SEPARATION) + "vw")
               .css("top", "" + (1) + "vw")
               .css("z-index", "" + 0);
        }
        
        function packBase() {
            div.css("position", "absolute")
               .css("width", WIDTH + "vw")
               .css("left", "" + (9 * LEFT_SEPARATION) + "vw")
               .css("top", "" + (1) + "vw")
               .css("z-index", "" + 0);
        }
        
        var stack = this;
        var div = this.base;
        if(this.type === "table") tableBase();
        if(this.type === "bank") bankBase();
        if(this.type === "pack") packBase();        
        this.makeDroppable(div);
    }
    
    doLayout() {
        function tableLayout() {
            for(var i = 0; i < stack.cards.length; i++) {
                var card = stack.cards[i];
                var div = DOM[card];
                div.css("position", "absolute")
                   .css("width", WIDTH + "vw")
                   .css("left", "" + (stack.index * LEFT_SEPARATION) + "vw")
                   .css("top", "" + (TOP_SEPARATION * i + TOP_OFFSET) + "vw")
                   .css("z-index", "" + i);
            }
            // journal flip of top card
            if(!stack.isStackEmpty()) {
                var top = stack.getTop();
                var div = DOM[top];
                if(div.data("card-info").isFaceDown === true) {
                    journal.push({ type:"flip", flip:top });
                    flip(top);
                }
            }
        }
        
        function bankLayout() {
            for(var i = 0; i < stack.cards.length; i++) {
                var card = stack.cards[i];
                var div = DOM[card];
                div.css("position", "absolute")
                   .css("width", WIDTH + "vw")
                   .css("left", "" + (stack.id * LEFT_SEPARATION) + "vw")
                   .css("top", "" + (1) + "vw")
                   .css("z-index", "" + card % 52);
            }            
        }
        
        function packLayout() {
            for(var i = 0; i < stack.cards.length; i++) {
                var card = stack.cards[i];
                var div = DOM[card];
                div.css("position", "absolute")
                   .css("width", WIDTH + "vw")
                   .css("left", "" + (9 * LEFT_SEPARATION) + "vw")
                   .css("top", "" + (1) + "vw")
                   .css("z-index", "" + i);
                div.data("card-info").isFaceDown = true;
                flip(card);
            }
            // make sure top card of pack is face down
            if(!stack.isStackEmpty()) {
                var top = stack.getTop();
                var div = DOM[top];
                if(div.data("card-info").isFaceDown === false) flip(top);       
            }
            // and clickable if undo puts card back on pack
            stack.removeClickHandler();
            stack.addClickHandler();
            
            // position pack counter
            if(packCounter === undefined) { // packCounter is a global variable
                packCounter = true;  // ensure this code is only executed once
                console.log(stack.length());
                var html = "<div id='packCounter'>" + stack.length() + "</div>";        
                div = $(html);
                $("#cards").append(div);
                $(div).css("position", "absolute")
                      .css("width", WIDTH + "vw")
                      .css("left", "" + (9 * LEFT_SEPARATION) + "vw")
                      .css("top", "" + (1) + "vw")
                      .css("opacity", "0.5")
                      .css("z-index", "" + 1000);                
            } else {
                $("#packCounter").text("" + stack.length());
            }            
        }
        var stack = this;
        if(this.type === "table") tableLayout();
        if(this.type === "bank") bankLayout();
        if(this.type === "pack") packLayout();
    }
    
    makeDroppable(div) {
        div.droppable(
            { 
                drop:   function(event, ui) { 
                            //console.log("dropping");
                            doDrop(this); 
                        }
            });
    }
    
    makeDraggable(div) {
        div.draggable(
            { 
                start:  function(event, ui) { 
                            //console.log("start dragging");
                            draggingInProgress = true;
                            doDrag(this); 
                        },
                stop:   function(e, ui) {
                            //console.log("stop dragging");
                            draggingInProgress = false;
                            //var dragStackIndex = $(div).data("card-info").stackIndex;
                            //var dragStack = stacks[dragStackIndex];
                            //dragStack.doLayout();
                            //dragStack.doDragAndDrop();
                        },
                revert: function() { 
                            if(draggingInProgress) {
                                draggingInProgress = false;
                                return true;
                            } else {
                                return false;
                            }
                        }
            });
    }

    doDragAndDrop() {
        function enableOrDisableDragAndDrop() {
            // disable drag and drop on all but last card
            for(var i = 0; i < stack.cards.length; i++) {
                var card = stack.cards[i];
                var div = DOM[card];
                div.draggable("disable");
                div.droppable("disable");
            }
            // make last card drag and droppable
            if(!stack.isStackEmpty() && stack.type === "table") {
                var top = stack.getTop();
                var div = DOM[top];
                div.draggable("enable");
                div.droppable("enable");
            }
        }

        var stack = this;
        if(this.type === "table") enableOrDisableDragAndDrop();
        if(this.type === "pack") enableOrDisableDragAndDrop();
        
    }

    push(card, isFaceDown) {
        this.cards.push(card);
        var div = DOM[card];
        div.data("card-info", 
        { 
            stackIndex: this.index,
            isFaceDown: isFaceDown
        });
        if(isFaceDown) flip(card);
        this.makeDraggable(div);
        this.makeDroppable(div);
    }
    
    compute() {
//        console.log(this.cards);
        // how cards are in pip sequence
        var up = this.howManyCardsSequence(+1);
        var down = this.howManyCardsSequence(-1);
        if(up > 1) 
            this.sequence = up - 1;
        else if(down > 1)
            this.sequence = -(down - 1);
        else
            this.sequence = 0;
        
        // how many in pip and suit sequence
        var count = 1;
        var cards = this.cards;
        var top = cards[cards.length - 1];
        for(var i = cards.length - 2;  i >= 0; i--) {
            var next = cards[i];
            if(cardIsFaceDown(next)) break;
            if((next%52 - top%52) === 1) count++; else break;
            top = next;
        }
        this.suitSequence = count;
    }
    
    howManyCardsSequence(direction) {
        var count = 1;
        var cards = this.cards;
        var top = cards[cards.length - 1];
        for(var i = cards.length - 2;  i >= 0; i--) {
            var next = cards[i];
            if(cardIsFaceDown(next)) break;
            var topPip = pip(top);
            var nextPip = pip(next);
            if((topPip - nextPip) === direction) count++; else break;                
            top = next;
        }
        return count;
    }
    
    getTop() {
        return this.cards[this.cards.length - 1];
    }
    
    length() {
        return this.cards.length;        
    }

    isStackEmpty() {
        var isStackEmpty = (this.length() === 0) ? true : false;         
        return isStackEmpty;
    }
    
    bankStackWillAccept(dragStack) {
        var bankStack = this;
        var howMany;
        
        if(bankStack.isStackEmpty()) {
            var draggedTop = dragStack.getTop();
            var draggedPip = pip(draggedTop);
            if(draggedPip === 1) {
               howMany = dragStack.suitSequence;
            } else {
               howMany = 0;
            }
        } else {
            var bankTop = bankStack.getTop() % 52;
            var draggedTop = dragStack.getTop() % 52;
            if(draggedTop - bankTop === 1)
                howMany = dragStack.suitSequence;
            else
                howMany = 0;            
        }
        return howMany;
    }
    
    dropStackWillAccept(dragStack) {
        function howManyEmptyStacksApartFromUs() {
            var count = 0;
            for(var i = 0; i < stacks.length; i++) {
                var stack = stacks[i];
                if(stack.type === "table" && stack.length() === 0) count++;
            }
            // don't count ourselves if we are a table stack
            if(dragStack.type === "table" && dragStack.length() === 0) count--;
            return count;
        }

        var dropStack = this;
        var emptyStacks = howManyEmptyStacksApartFromUs();
        var maxCardsCanMove = Math.pow(2, emptyStacks);
        
        // drop stack might be empty, but then topPip will be undefined, which is OK
        var howMany = 0;
        var isThisStackEmpty = dropStack.isStackEmpty();
        var top = dropStack.getTop();
        var draggedTop = dragStack.getTop();
        var topPip = pip(top);
        var draggedPip = pip(draggedTop);
        var sequence = dragStack.sequence;
        
        // console.log("drag sequence: " + sequence);
        if(sequence === 0) {
            if(topPip - draggedPip === 1 || isThisStackEmpty) howMany = 1;
        }
        if(sequence > 0) {
            if(topPip - draggedPip === 1 || isThisStackEmpty) {
                var inSequence = sequence + 1;
                howMany = inSequence;
            }
        } 
        if(sequence < 0) {
            var inSequence = -(sequence - 1);
            var count = (inSequence <= maxCardsCanMove) ? inSequence : maxCardsCanMove;
            if(isThisStackEmpty) {
                howMany = count;
            } else {
                if(topPip - draggedPip <= count)
                    howMany = topPip - draggedPip;
            }
        }
        console.log("transfer: " + howMany);
        return howMany;    
    }
    
    transfer(dragStack, count, undo) {
        var dropStack = this;
        var cards = [];
        for(var i = 0; i < count; i++) {
            var card = dragStack.cards.pop();
            cards.push(card);
        }
        // note that stacks are reversed during an undo
        if(undo && dragStack.type === "bank") cards.reverse();
        if(!undo && dropStack.type === "bank") cards.reverse();
        if(dragStack.sequence > 0) cards.reverse();
        
        // pass a copy of cards to journal
        addToJournal(cards.slice(0), dragStack, dropStack, undo);

        for(var i = 0; i < count; i++) {
            var card = cards.pop();
            dropStack.cards.push(card);
            var div = DOM[card];
            div.data("card-info").stackIndex = dropStack.index;
        }
        
        dropStack.doLayout();
        dragStack.doLayout();
        dropStack.doDragAndDrop();
        dragStack.doDragAndDrop();
    }
    
    removeClickHandler() {
        if(this.type === "pack") {
            var packStack = this;
            for(var i = 0; i < this.cards.length; i++) {
                var card = this.cards[i];
                var div = DOM[card];
                div.off("click");
            }
        }        
    }
    
    addClickHandler() {
        if(this.type === "pack") {
            var packStack = this;
            for(var i = 0; i < this.cards.length; i++) {
                var card = this.cards[i];
                var div = DOM[card];
                div.click(packStack, function() {
                        var firstTableStack = Stack.find("table", 0);
                        var firstTableIndex = firstTableStack.index;
                        
                        // move a card to each table stack
                        for(var i = 0; i < TABLE_STACKS; i++) {
                            var targetStack = stacks[firstTableIndex + i];
                            var undo = false;
                            targetStack.transfer(packStack, 1, undo);
                            
                            // disable click handler for dealt cards
                            var top = targetStack.getTop();
                            var div = DOM[top];
                            div.off("click");
                        }
                        journal.push( { type:"deal", cards:TABLE_STACKS } );
                    }
                );
            }
        }
    }
}

// end of class
// global functions follow

function addToJournal(cards, dragStack, dropStack, undo) {
    var entry = { 
                  type: "table", 
                  cards: cards,
                  from: dragStack.index,
                  to:   dropStack.index
                };
    if(!undo) journal.push(entry);

}

function pip(card) {
    // Ace(0, 13, 26, ...) -> 1
    // Two(1, 14, 27, ...) -> 2
    // ...
    // King(12, 25, 38, ...) -> 13
    return card % 13 + 1;
}

function cardIsFaceDown(card) {
    var div = DOM[card];
    return div.data("card-info").isFaceDown;
}

function doDrag(div) {
    console.log("doDrag");    
    var stackIndex = $(div).data("card-info").stackIndex;
    dragStackIndex = $(div).data("card-info").stackIndex;
}

function doDrop(div) {
    if(draggingInProgress === undefined) return;
    draggingInProgress = undefined;
    console.log("doDrop");
    
    var dropStackIndex = $(div).data("card-info").stackIndex;
    var dragStack = stacks[dragStackIndex];
    var dropStack = stacks[dropStackIndex];
    dragStack.compute();

    var count;
    if(dropStack.type === "table") {
        count = dropStack.dropStackWillAccept(dragStack);
    } else {  // bank
        bankStack = dropStack;
        count = bankStack.bankStackWillAccept(dragStack);
    }
    //console.log("count: " + count);
    var undo = false;
    dropStack.transfer(dragStack, count, undo);
}

function dump(n) {
    var stack = stacks[n];
    var s = "";
    for(var i = 0; i < stack.length(); i++) {
        s = s + "" + stack.cards[i]%52 + ",";
    }
    console.log(stack.type + ":" + stack.id + "   " + s)
}
var d = dump;