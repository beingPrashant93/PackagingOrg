import { LightningElement,api } from 'lwc';

export default class Ihlisttile extends LightningElement {
    @api headerBackroundColor;
    @api bodyBackroundColor;
    @api tileid='';
    @api summary='';
    @api description='';
    @api icon='';
    @api iconcolour='';
    @api styleclass='';
    @api size='Medium';
    @api iconsize;
    @api listingrowstyle='Expanded';
    @api style2;
    @api style3;
    @api style4;
    @api listheight;
    @api stylewhitecard;
    @api uxtheme;
    @api darkmodewhitecol;
    @api rocketiconsize;
    @api fullContaint;
    @api HeaderTileOnly;
    bodyTextColor;
    headerTextColor;
    
    @api get tcclass(){
        return (this.styleclass + ' TileContainer TileContainer' + this.size);
    }

    @api get dividb(){
        return (this.tileid + 'Body');
    }

    @api get iditag(){
        return (this.tileid + 'Icon');
    }

    @api get divids(){
        return (this.tileid + 'Summary');
    }

    @api get dividd(){
        return (this.tileid + 'Description');
    }

    
    @api get heightclass(){
        return (this.listheight);
    }

    @api get spanstyle(){
        return (this.styleclass == '' || this.styleclass == null || this.styleclass + '' == 'null' ? 'color: #' + this.iconcolour + ';' : '');
    }

    @api get divstyle(){
        return ('color: ' + this.iconcolour + ';');
    }

    @api get iclass(){
        return ('fa ' + this.icon + ' fa-stack-1x fa-inverse');
    }    

    @api get summeryclass(){
        return ('Summary' + this.size + ' TileText');
    }
    @api get Bodyhideclass(){
        return ('SummarynotE' + this.size + ' TileText');
    }

    @api get descriptionclass(){
        return ('Description' + this.size + ' TileText');
    }
    @api get headertyletextclass(){
        return ('textclass'+this.size);
    }
    @api get expandedclass(){
        return (this.listingrowstyle == 'Expanded' ?true:false);
    }
    @api get toptextcolor(){
        return ('color:#'+ this.headerTextColor +';');
    }
    @api get bottomtextcolor(){
        return ('color:#'+this.bodyTextColor+';');
    }
    // @api get Marginclass(){
    //     return ('text-align: center; margin: 1rem;');
    // }
    @api get iconesize(){
        return(this.rocketiconsize);
    }
    @api get iconclass(){
        return ('IconSize'+this.size);
    }
    @api get containerclass(){
        return ( this.fullContaint);
    }
    @api get halfcontaint(){
        return (this.HeaderTileOnly);
    }
    @api get iconcolorclass(){
        return `--sds-c-icon-color-foreground-default:#${this.style2}`;
    }
    connectedCallback(){

        // if your "Listing row style" is Hidden then this will hide the container class and open the header tile Only 
        if(this.listingrowstyle == 'Hidden'){
            this.fullContaint = 'container slds-hide';
            
            
        }else{
            // if your "Listing row style" is Expanded then this will hide the "header tile Only" class and open the container class
            this.fullContaint = 'container';         
            this.HeaderTileOnly = 'slds-hide';   

            
        }    
        this.initialisetile();
        
        this.headerBackroundColor = `background-color:#${this.style2};`           
        this.bodyBackroundColor = `background-color:#${this.stylewhitecard};`         
       
        
        
        if(this.uxtheme == 'Dark'){
            this.headerTextColor = this.darkmodewhitecol;     
            this.bodyTextColor = this.darkmodewhitecol;  

        }else{
            this.bodyTextColor = this.style2;
            this.headerTextColor = this.stylewhitecard;
        }
            
        
    }
   
        
    
    // Set sizing parameters based on incoming size setting
    initialisetile(evt){
    
        switch (this.size) {
			case 'Smallest':
                
                this.listheight = 'height: 140px;';
                this.rocketiconsize = 'xx-small';
				break;
			
			case 'Small':
               
                this.listheight = 'height: 225px;';
                this.rocketiconsize = 'small';
				break;

			case 'Medium':
                
                this.listheight = 'height:265px';
                this.rocketiconsize = 'medium';
				break;

			case 'Large':
                
                this.listheight = 'height: 360px';
                this.rocketiconsize = 'large';
				break;
				
			default:
                this.listheight = 'height:265px';
                this.rocketiconsize = 'medium';
				break;
		}
    }

}