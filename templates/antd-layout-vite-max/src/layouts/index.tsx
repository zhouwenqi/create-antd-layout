import { BrandPopoverPanel, UserPopoverPanel } from "@/components/PopoverPanel"
import { ThemeButton } from "@/components/ThemeButton"
import { AntdLayout } from "@adminui-dev/antd-layout"
import { menuData } from "./menuData"
import { LanguageButton } from "@/components/LanguageButton"
import { layoutConfig } from "./layout.config"
import { localeMessages } from "./localeMessages"

/**
 * =========
 *  layout
 * =========
 * The most essential component
 * 
 * @returns 
 */
export default function(){ 
    return(
        <>
            <AntdLayout layoutConfig={layoutConfig} menuData={menuData} localeMessages={localeMessages}>
                <AntdLayout.BrandPopoverContent>
                    <BrandPopoverPanel />
                </AntdLayout.BrandPopoverContent>
                <AntdLayout.AvatarPopoverContent>
                    <UserPopoverPanel />
                </AntdLayout.AvatarPopoverContent>
                <AntdLayout.HeaderToolbarExtra>
                    <LanguageButton />
                    <ThemeButton />
                </AntdLayout.HeaderToolbarExtra>
            </AntdLayout>
        </>
    )
}