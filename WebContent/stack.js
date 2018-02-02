class Stack {

    constructor(id, index, type) {
        this.id = id;
        this.type = type;
        this.index = index;
        this.cards = [];
    }

    static find(searchType, searchId) {
        var result;
        for(var i = 0; i < stacks.length; i++) {
            var type = stacks[i].type;
            var id = stacks[i].id;
            if(searchType === type && searchId === id) {
                result = stacks[i];
            } 
        }
        return result;
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
        }
        
        function bankLayout() {
            for(var i = 0; i < stack.cards.length; i++) {
                var card = stack.cards[i];
                var div = DOM[card];
                div.css("position", "absolute")
                   .css("class", "yyyyyyyy")
                   .css("width", WIDTH + "vw")
                   .css("left", "" + i*2 + "vw")
                   .css("top", "" + (i*2 + 10) + "vw")
                   .css("visibilty", "hidden")
                   .css("z-index", "" + i);
            }            
        }
        
        function packLayout() {
            for(var i = 0; i < stack.cards.length; i++) {
                var card = stack.cards[i];
                var div = DOM[card];
                div.css("position", "absolute")
                   .css("width", WIDTH + "vw")
                   .css("left", "" + 90 + "vw")
                   .css("top", "" + 4 + "vw")
                   .css("z-index", "" + i);
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
        function tableDragAndDrop() {
            // make every card droppable
            for(var i = 0; i < stack.cards.length; i++) {
                var card = stack.cards[i];
                var div = DOM[card];
                div.draggable("disable");
                div.droppable("enable");
            }
            // make last card draggable
            var top = stack.getTop();
            var div = DOM[top];
            div.draggable("enable");
        }

        var stack = this;
        if(this.type === "table") tableDragAndDrop();
//        if(this.type === "bank") bankDragAndDrop();
//        if(this.type === "pack") packDragAndDrop();
        
    }
    
    push(card) {
        this.cards.push(card);
        var div = DOM[card];
        div.data("card-info", 
        { 
            stackIndex:this.index,
        });
        this.makeDraggable(div);
        this.makeDroppable(div);
    }
    
    compute() {
//        console.log(this.cards);
        var up = this.howManyCardsSequence(+1);
        var down = this.howManyCardsSequence(-1);
        if(up > 1) 
            this.sequence = up - 1;
        else if(down > 1)
            this.sequence = -(down - 1);
        else
            this.sequence = 0;
    }
    
    howManyCardsSequence(direction) {
        var count = 1;
        var cards = this.cards;
        var top = cards[cards.length - 1];
        for(var i = cards.length - 2;  i > 0; i--) {
            var next = cards[i];
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
    
    dropStackWillAccept(dragStack) {
        function howManyEmptyStacks() {
            var count = 0;
            for(var i = 0; i < stacks.length; i++) {
                var stack = stacks[i];
                if(stack.type === "table" && stack.length() === 0) count++;
            }
            return count;
        }
        
        var howMany = 0;
        var emptyStacks = howManyEmptyStacks();
        var maxCardsCanMove = Math.pow(2, emptyStacks);
        var isThisStackEmpty = (this.length() === 0) ? true : false; 
        
        var top = this.getTop();
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
    
    transfer(dragStack, count) {
        var dropStack = this;
        var cards = [];
        for(var i = 0; i < count; i++) {
            var card = dragStack.cards.pop();
            cards.push(card);
        }
        
        if(dragStack.sequence > 0) cards.reverse();
        
        addToJournal(cards, dragStack, dropStack);
        
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
}

var dragging = false;
var dropping = false;
var draggingInProgress = true;
var dragStackIndex;

function addToJournal(cards, dragStack, dropStack) {
    for(var i = 0; i < cards.length; i++) {
        var entry = { 
                      card: cards[i],
                      from: dragStack.index,
                      to:   dropStack.index
                    }
        journal.push(entry);
    }
}

function pip(card) {
    // Ace(12) -> 1
    // Two(0) -> 2
    // ...
    // King(11) -> 13
    return (card + 1) % 13 + 1;
}

function doDrag(div) {
    //if(dragging) return;
    console.log("doDrag");

    // stop multiple drags
//    dragging = true;
//    dropping = false;
    
    var stackIndex = $(div).data("card-info").stackIndex;
    dragStackIndex = $(div).data("card-info").stackIndex;
}

function doDrop(div) {
    if(draggingInProgress === undefined) return;
    draggingInProgress = undefined;
    console.log("doDrop");
    
    // stop multiple drops
//    dragging = false;
//    dropping = true;
    
    var dropStackIndex = $(div).data("card-info").stackIndex;
    var dragStack = stacks[dragStackIndex];
    var dropStack = stacks[dropStackIndex];
    dragStack.compute();
    dropStack.compute();
    var count = dropStack.dropStackWillAccept(dragStack);
    //console.log("count: " + count);
    dropStack.transfer(dragStack, count);
}
