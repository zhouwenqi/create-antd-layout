import type { LayoutConfig } from "@adminui-dev/antd-layout"
import WardenLogo from "@/components/WardenLogo"

// layout config
export const layoutConfig:LayoutConfig = {
    layoutType:"leftMenu",  
    asideMenuInline:true,
    hideAsideMenuDataEmpty:true,
    largeBrand:true,    
    brandInfo:{
        logo:<WardenLogo />,
        name:"Warden.vip",
        title:"Web build frameworks"
    },
    userInfo:{
        uid:"Scapegoat",
        title:"zhouwenqi@me.com",
        avatar:"https://api.dicebear.com/9.x/miniavs/svg?seed=8"
    }
}