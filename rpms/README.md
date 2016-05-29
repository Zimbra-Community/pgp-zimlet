# Prebuilt packages
* We are working out to make an official repository for all RPM packages. In this meantime, please use Copr at: https://copr.fedorainfracloud.org/coprs/zetalliance/zimlets/

# Installing from Copr repository using YUM
* Enable Copr repo (run once): download repo file and save into /etc/yum.repos.d:
  * For EL6: `wget https://copr.fedorainfracloud.org/coprs/zetalliance/zimlets/repo/epel-6/zetalliance-zimlets-epel-6.repo -O /etc/yum.repos.d/zetalliance-zimlets-epel-6.repo`
  * For EL7: `wget https://copr.fedorainfracloud.org/coprs/zetalliance/zimlets/repo/epel-7/zetalliance-zimlets-epel-7.repo -O /etc/yum.repos.d/zetalliance-zimlets-epel-7.repo`
* Install using YUM: `yum install pgp-zimlet`
* Update/upgrade: `yum update pgp-zimlet`
* And uninstall: `yum remove pgp-zimlet`
