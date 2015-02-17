<?php

/*
 * Getting Started With PGP Demostration 
 * 1. Show how to forge the FROM header of an email 
 * 2. Show how to capture an unencrypted mail
 * tshark  -f "port 25"  -i enp3s0
 * 
 * */

mail ( "bgraaff@hivos.nl" , "Thanks for your work on Zimbra OpenPGP Zimlet" , "Hi Barry\r\n\r\nYou are the best!\r\n\r\nBarack." , 'From: Barack Obama <barack@whitehouse.gov>' . "\r\n" );
