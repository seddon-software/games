class Stack {

    constructor(col) {
        // expose internal methods
        var findDirection = undefined;

        this.width = WIDTH;
        this.padding = PADDING;
        this.col = col;
        this.childDivs = [];
        var id = "col" + col;
        var theHtml = "<div id=" + id + "></div>";
        var colDiv = $(theHtml).clone();
        $("div#table").append(colDiv);
        this.pushBlank();
    }
    
    static getStack(div) {
        var stackNo = $(div).data("card-info").col;
        return stacks[stackNo];
    }

    static howManyCardsInSequence(stack, direction) {
        var count = 1;
        var divs = stack.childDivs;
        var top = divs[divs.length - 1];
        for(var i = divs.length - 2;  i > 0; i--) {
            var next = divs[i];
            var topPip = Stack.pip(top);
            var nextPip = Stack.pip(next);
            if(direction === "ascending") if((topPip - nextPip) === 1) count++; else break;                
            if(direction === "descending") if((nextPip - topPip) === 1) count++; else break;                
            top = next;
        }
        return count;
    }
    
    static pip(card) {
        var index = card.data("card-info").index;
        // Ace(12) -> 1
        // Two(0) -> 2
        // ...
        // King(11) -> 13
        return (index + 1) % 13 + 1;
    }

    addAttributes(div, index) {
        var card = (index === undefined) ? "blank.svg" : cards[index%52];
        
        div.data("card-info", 
            { 
                col:this.col,
                index:index,
                card:card
            });
    }

    doLayout() {
        for(var i = 0; i < this.length(); i++) {  
            this.childDivs[i].data("card-info").col = this.col;
            this.childDivs[i].css("z-index", i)
                             .css("width", "" + this.width + "vw")
                             .css("left", "" + this.col*(this.width + 2*this.padding) + "vw")
                             .css("top", "+" + (1+i)*2 + "vh");
        }
    }
    
    length() {
        return this.childDivs.length;
    }
    
    makeDraggable(div) {
        div.draggable(
            { 
                drag: function(e, ui) { 
                    cardBeingDragged = $(this);
                },
                stop: function(e, ui) {
                    theStack = Stack.getStack(this);
                    theStack.doLayout();
                } 
            });        
    }
    
    makeDroppable(div) {
        div.droppable(
            { 
                drop: function (event, ui) {
                    function findDirection(stack) {
                        var up = Stack.howManyCardsInSequence(stack, "ascending");
                        var down = Stack.howManyCardsInSequence(stack, "descending");
                        var result = {};
                        if(up > 1) {
                            result.direction = "up";
                            result.count = up;
                        } else if(down >= 1) {
                            result.direction = "down";
                            result.count = down;
                        }
                        return result;
                    }
                    
                    function howManyCardsCanMove(stack, cardBeingDragged, cardsCanDrop) {
                        function howManyEmptyStacks() {
                            var count = 0;
                            for(var i = 0; i < stacks.length; i++) {
                                if(stacks[i].length() === 1) count++;
                            }
                            return count;
                        }
                        
                        var howMany = 0;
                        var emptyStacks = howManyEmptyStacks();
                        var maxCardsCanMove = Math.pow(2, emptyStacks);
                        var isStackEmpty = (stack.length() === 1) ? true : false; 
                        
                        var divs = stack.childDivs;
                        var top = divs[divs.length - 1];
                        var topPip = Stack.pip(top);
                        var draggedPip = Stack.pip(cardBeingDragged);
                        
                        if(cardsCanDrop.direction === "up") {
                            if(topPip - draggedPip === 1 || isStackEmpty) {
                                howMany = cardsCanDrop.count;
                            }
                        } 
                        if(cardsCanDrop.direction === "down") {
                            var count = (cardsCanDrop.count <= maxCardsCanMove) ? cardsCanDrop.count : maxCardsCanMove;
                            if(isStackEmpty) {
                                howMany = count;
                            } else {
                                if(topPip - draggedPip <= count)
                                    howMany = topPip - draggedPip;
                            }
                        }
                        return howMany;
                    }

                    if(cardBeingDragged === undefined) return;  // multiple drops
                    var dragStackNo = cardBeingDragged.data("card-info").col;
                    var dropStackNo = $(this).data("card-info").col;
                    var dropStack = stacks[dropStackNo];
                    var dragStack = stacks[dragStackNo];
                    
                    var cardsCanDrop = findDirection(dragStack);
                    console.log(cardsCanDrop);
                    cardsCanDrop.count = howManyCardsCanMove(dropStack, cardBeingDragged, cardsCanDrop);
                    Stack.transferMultiple(dropStack, dragStack, cardsCanDrop);
                    cardBeingDragged = undefined;  // to avoid multiple drops
                    if(debug) Stack.doDebug();
                }
            });        
    }

    push() {
        var index = cardIndex.pop();
        var part1 = "<div><img style='width: 100%; height: auto;' src='images/cards/";
        var part2 = cards[index%52];    // %52 because of 2 packs of cards
        var part3 = "'/></div>";
        var theHtml = part1 + part2 + part3;
        var childDiv = $(theHtml).clone();
        var selector = "div#col" + this.col;
        $(selector).append(childDiv);
        this.addAttributes(childDiv, index);
        this.makeDroppable(childDiv);
        this.makeDraggable(childDiv);
        this.childDivs.push(childDiv);
    }
    
    pushBlank() {
        var theHtml = "<div><img style='width: 100%; height: auto;' src='images/cards/blank.svg'/></div>";
        var childDiv = $(theHtml).clone();
        var selector = "div#col" + this.col;
        $(selector).append(childDiv);
        childDiv.css("visibility", "hidden");
        this.addAttributes(childDiv, undefined);
        this.makeDroppable(childDiv);
        this.makeDraggable(childDiv);
        this.childDivs.push(childDiv);
    }
    
    setupDraggableOnBottomCard() {
        var topDiv = this.childDivs[this.childDivs.length - 1];
        topDiv.draggable("enable");
        
        for(var i = 0; i < this.length() - 1; i++) {  
            var div = this.childDivs[i];
            div.draggable("disable");
        }
    }

    static popDivs(stack, count) {
        var divs = [];
        for(var i = 0; i < count; i++) {
            // remove div from old stack
            var div = stack.childDivs.pop();
            divs.push(div);
        }
        return divs;
    }
    
    static pushDivs(stack, divs) {
        var count = divs.length;
        for(var i = 0; i < count; i++) {
            // remove div from temporary array
            var div = divs.pop();
            stack.childDivs.push(div);
        }
    }
    
    static cloneDivs(divs) {
        return divs.slice(0);
    }
    
    static transferMultiple(dropStack, dragStack, cardsCanDrop) {
        // disable drag on previous top of drop stack
        var count = cardsCanDrop.count;
        var length = dropStack.childDivs.length;
        var top = dropStack.childDivs[length - 1];
        top.draggable('disable');

        // pop divs to be transfered and push to new stack
        var childDivs = Stack.popDivs(dragStack, count);
        
        if(cardsCanDrop.direction == "up") childDivs.reverse();
        Stack.pushDivs(dropStack, childDivs);
        
        // add divs to dom
        var selector = "div#col" + dropStack.col;
        var length = dropStack.childDivs.length;
        for(var i = 0; i < count; i++) {
            var div = dropStack.childDivs[length - 1 - count];
            $(selector).append(div);
        }
        
        // make top div draggable on stacks
        if(dragStack.length() > 0) dragStack.setupDraggableOnBottomCard();
        if(dropStack.length() > 0) dropStack.setupDraggableOnBottomCard();
        
        // redo layout for stack
        dropStack.doLayout();
    }    
    
    static debugIt() {
        for(var i = 0; i < stacks.length; i++) {
            var stack = stacks[i];
            for(var row = 0; row < stack.length(); row++) {
                var div = stack.childDivs[row];
            }
        }
    }
}

class Reservoir {
    
    constructor(col) {
        this.col = col;
        this.width = WIDTH;
        this.padding = PADDING;
        this.childDivs = [];
        var theHtml = "<div><img style='width: 100%; height: auto;' src='images/cards/blank2.svg'/></div>";
        var childDiv = $(theHtml).clone();
        var selector = "div#reservoir";
        $(selector).append(childDiv);
        this.addAttributes(childDiv);
        this.makeDroppable(childDiv);
        this.childDivs.push(childDiv);
        Reservoir.position(this.childDivs[0]);
    }

    static position(div) {
        div.css("width", "" + WIDTH + "vw")
           .css("padding", "" + PADDING + "vw")
    }
    length() {
        return this.childDivs.length;  
    }
    
    addAttributes(div) {
        div.data("reservoir-info", 
            { 
                col:this.col
            });
    }
    
    
    makeDroppable(div) {
        function howManyCardsCanBeBanked(dragStack) {
            var childDivs = dragStack.childDivs;
            var top = childDivs[childDivs.length - 1];
            var count = 1;
            for(var i = childDivs.length - 2; i > 0; i--) {
                var topPip = Stack.pip(top);
                var next = childDivs[i];
                var nextPip = Stack.pip(next);
                if(nextPip - topPip !== 1) break;
                count++;
                top = next;
            }
            return count;
        }
        
        function transfer(dragStack, dropReservoir, numberOfCards) {
            function popFromDragStack() {
                var divs = [];
                for(var i = 0; i < numberOfCards; i++) {
                    divs.push(dragStack.childDivs.pop())
                }
                return divs;
            }
            function pushToDropReservoir() {
                for(var i = 0; i < numberOfCards; i++) {
                    dropReservoir.childDivs.push(divs.pop())
                }
            }
            function disableDragOnReservoir() {
                var divs = dropReservoir.childDivs;
                var top = divs[divs.length - 1];
                top.draggable('disable');                
            }
            function enableDragForTopOfDragStack() {
                var divs = dragStack.childDivs;
                var top = divs[divs.length - 1];
                top.draggable('enable');                                
            }
            function moveChildDivsInDOM() {
                var selector = "reservoir#col" + dropReservoir.col;
                var length = dropReservoir.childDivs.length;
                for(var i = 0; i < numberOfCards; i++) {
                    var div = dropReservoir.childDivs[length - 1 - numberOfCards];
                    $(selector).append(div);
                }
            }
            function doLayout() {
                var length = dropReservoir.childDivs.length;
                for(var i = 0; i < length; i++) {
                    var div = dropReservoir.childDivs[i];
                    Reservoir.position(div);
                }                
            }
            console.log("xfer");
            
            var divs = popFromDragStack();
            pushToDropReservoir(divs);
            disableDragOnReservoir();
            enableDragForTopOfDragStack();
            moveChildDivsInDOM();
            doLayout();
            // (optional) update attributes
        }

        div.droppable(
            { 
                drop: function (event, ui) { 
                    if(cardBeingDragged === undefined) return;  // multiple drops
                    console.log("dropped");
                    var dragStackNo = cardBeingDragged.data("card-info").col;
                    var dropReservoirNo = $(this).data("reservoir-info").col;
                    var dragStack = stacks[dragStackNo];
                    var dropReservoir = reservoirs[dropReservoirNo];

                    var howMany = howManyCardsCanBeBanked(dragStack);
                    
                    var dragPip = Stack.pip(cardBeingDragged);
                    var topPip;
                    if(dropReservoir.length() === 1) {
                        topPip = 0;
                    } else {
                        var top = dropReservoir.childDivs[dropReservoir.length()];
                        topPip = Stack.pip(top);
                    }
                    if(dragPip - topPip === 1) {
                        var numberOfCards = howMany;
                        transfer(dragStack, dropReservoir, numberOfCards);
                    }
                }
            });        
    }    
}
